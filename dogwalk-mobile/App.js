import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { isSupabaseConfigured, supabase } from './supabase';

const warningCategories = ['Bugs/Ticks', 'Broken glass', 'Aggressive dog', 'Construction', 'Toxic plants'];

function formatMeters(meters) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState('track');
  const [currentRoute, setCurrentRoute] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [savedWalks, setSavedWalks] = useState([]);
  const [warningText, setWarningText] = useState('');
  const [warningCategory, setWarningCategory] = useState(warningCategories[0]);
  const [warnings, setWarnings] = useState([]);

  const [followTarget, setFollowTarget] = useState('');
  const [following, setFollowing] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const watchRef = useRef(null);

  const distanceMeters = useMemo(() => {
    if (currentRoute.length < 2) return 0;

    return currentRoute.slice(1).reduce((total, point, index) => {
      const prev = currentRoute[index];
      const dx = point.latitude - prev.latitude;
      const dy = point.longitude - prev.longitude;
      const approxMeters = Math.sqrt(dx * dx + dy * dy) * 111_139;
      return total + approxMeters;
    }, 0);
  }, [currentRoute]);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user?.id) return;

    loadRemoteData();
  }, [session?.user?.id]);

  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const loadRemoteData = async () => {
    if (!session?.user?.id) return;

    setLoadingData(true);

    const [walksResult, warningsResult, followsResult] = await Promise.all([
      supabase
        .from('walks')
        .select('id,created_at,distance_m,elapsed_seconds,point_count')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('warnings')
        .select('id,category,message,source,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('follows')
        .select('followee_id,created_at')
        .eq('follower_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    if (walksResult.error) Alert.alert('Error', walksResult.error.message);
    if (warningsResult.error) Alert.alert('Error', warningsResult.error.message);
    if (followsResult.error) Alert.alert('Error', followsResult.error.message);

    if (walksResult.data) {
      setSavedWalks(
        walksResult.data.map((w) => ({
          id: String(w.id),
          createdAt: w.created_at,
          distanceMeters: Number(w.distance_m || 0),
          elapsedSeconds: Number(w.elapsed_seconds || 0),
          pointCount: Number(w.point_count || 0)
        }))
      );
    }

    if (warningsResult.data) {
      setWarnings(
        warningsResult.data.map((w) => ({
          id: String(w.id),
          category: w.category,
          message: w.message,
          source: w.source || 'Community',
          createdAt: w.created_at
        }))
      );
    }

    if (followsResult.data) {
      setFollowing(followsResult.data.map((f) => ({
        followeeId: f.followee_id,
        createdAt: f.created_at
      })));
    }

    setLoadingData(false);
  };

  const signUp = async () => {
    if (!isSupabaseConfigured) return;
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else Alert.alert('Success', 'Check your email for a confirmation link (if enabled).');
  };

  const signIn = async () => {
    if (!isSupabaseConfigured) return;
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need location access to track dog walks.');
      return;
    }

    setCurrentRoute([]);
    setElapsedSeconds(0);
    setIsTracking(true);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,
        distanceInterval: 10
      },
      (position) => {
        setCurrentRoute((prev) => [
          ...prev,
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          }
        ]);
      }
    );
  };

  const stopTracking = async () => {
    setIsTracking(false);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }

    if (currentRoute.length === 0) return;

    const walk = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      distanceMeters,
      elapsedSeconds,
      pointCount: currentRoute.length
    };

    setSavedWalks((prev) => [walk, ...prev]);

    if (isSupabaseConfigured && session?.user?.id) {
      const { error } = await supabase.from('walks').insert({
        owner_id: session.user.id,
        distance_m: distanceMeters,
        elapsed_seconds: elapsedSeconds,
        point_count: currentRoute.length
      });
      if (error) Alert.alert('Walk sync failed', error.message);
    }

    setCurrentRoute([]);
    setElapsedSeconds(0);
  };

  const addWarning = async () => {
    if (!warningText.trim()) return;

    const warning = {
      id: Date.now().toString(),
      category: warningCategory,
      message: warningText.trim(),
      createdAt: new Date().toISOString(),
      source: currentRoute.length > 0 ? 'During current walk' : 'Manual report'
    };

    setWarnings((prev) => [warning, ...prev]);
    setWarningText('');

    if (isSupabaseConfigured && session?.user?.id) {
      const { error } = await supabase.from('warnings').insert({
        reporter_id: session.user.id,
        category: warning.category,
        message: warning.message,
        source: warning.source
      });
      if (error) Alert.alert('Warning sync failed', error.message);
    }
  };

  const followUser = async () => {
    const trimmed = followTarget.trim();
    if (!trimmed) return;

    const localFollow = {
      followeeId: trimmed,
      createdAt: new Date().toISOString()
    };

    setFollowing((prev) => [localFollow, ...prev]);
    setFollowTarget('');

    if (isSupabaseConfigured && session?.user?.id) {
      const { error } = await supabase.from('follows').insert({
        follower_id: session.user.id,
        followee_id: trimmed
      });
      if (error) Alert.alert('Follow failed', error.message);
    }
  };

  const renderAuth = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sign in to sync data</Text>
      <Text style={styles.muted}>Use Supabase auth to persist walks, warnings, and follows.</Text>

      <TextInput
        autoCapitalize="none"
        value={authEmail}
        onChangeText={setAuthEmail}
        placeholder="Email"
        style={styles.input}
      />
      <TextInput
        secureTextEntry
        value={authPassword}
        onChangeText={setAuthPassword}
        placeholder="Password"
        style={styles.input}
      />

      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={signIn}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={signUp}>
          <Text style={styles.secondaryButtonText}>Sign up</Text>
        </Pressable>
      </View>

      {authLoading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );

  const renderTrack = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Track walk</Text>
      <Text>Time: {formatDuration(elapsedSeconds)}</Text>
      <Text>Distance: {formatMeters(distanceMeters)}</Text>
      <Text>GPS points: {currentRoute.length}</Text>

      <View style={styles.row}>
        {!isTracking ? (
          <Pressable style={styles.primaryButton} onPress={startTracking}>
            <Text style={styles.primaryButtonText}>Start walk</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.dangerButton} onPress={stopTracking}>
            <Text style={styles.primaryButtonText}>Stop & Save</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.cardTitle}>Report warning</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap}>
        {warningCategories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setWarningCategory(category)}
            style={[styles.chip, warningCategory === category && styles.chipActive]}
          >
            <Text style={warningCategory === category ? styles.chipTextActive : styles.chipText}>
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <TextInput
        value={warningText}
        onChangeText={setWarningText}
        placeholder="Example: lots of ticks near north gate"
        style={styles.input}
      />

      <Pressable style={styles.secondaryButton} onPress={addWarning}>
        <Text style={styles.secondaryButtonText}>Add warning</Text>
      </Pressable>
    </View>
  );

  const renderDiscover = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Warnings near you</Text>
      <FlatList
        data={warnings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No warnings yet. Add one from Track.</Text>}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listTitle}>{item.category}</Text>
            <Text>{item.message}</Text>
            <Text style={styles.muted}>{item.source}</Text>
          </View>
        )}
      />
    </View>
  );

  const renderSocial = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Shared walks</Text>
      <FlatList
        data={savedWalks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No walks yet. Track your first walk.</Text>}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listTitle}>Walk #{item.id.slice(-4)}</Text>
            <Text>{formatMeters(item.distanceMeters)} • {formatDuration(item.elapsedSeconds)}</Text>
            <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />

      <Text style={styles.cardTitle}>Follow user</Text>
      <TextInput
        value={followTarget}
        onChangeText={setFollowTarget}
        placeholder="Paste user UUID"
        style={styles.input}
      />
      <Pressable style={styles.secondaryButton} onPress={followUser}>
        <Text style={styles.secondaryButtonText}>Follow</Text>
      </Pressable>

      <Text style={styles.muted}>Following: {following.length}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>DogWalk Social MVP</Text>

      {!isSupabaseConfigured && (
        <Text style={styles.warningBanner}>
          Supabase not configured: running in local-only mode.
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable sync.
        </Text>
      )}

      {isSupabaseConfigured && !session && renderAuth()}

      {(!isSupabaseConfigured || session) && (
        <>
          <View style={styles.tabs}>
            {['track', 'discover', 'social'].map((key) => (
              <Pressable
                key={key}
                style={[styles.tab, tab === key && styles.tabActive]}
                onPress={() => setTab(key)}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{key}</Text>
              </Pressable>
            ))}
          </View>

          {isSupabaseConfigured && session && (
            <View style={styles.rowBetween}>
              <Text style={styles.muted}>Signed in as: {session.user.email}</Text>
              <Pressable onPress={signOut}>
                <Text style={styles.link}>Sign out</Text>
              </Pressable>
            </View>
          )}

          {loadingData ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <>
              {tab === 'track' && renderTrack()}
              {tab === 'discover' && renderDiscover()}
              {tab === 'social' && renderSocial()}
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f8fc',
    padding: 16,
    paddingTop: 28
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12
  },
  warningBanner: {
    backgroundColor: '#fff6e7',
    color: '#8b5e00',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9dce7',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  tabActive: {
    backgroundColor: '#2648ff',
    borderColor: '#2648ff'
  },
  tabText: {
    textTransform: 'capitalize',
    color: '#50576b'
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: '#2f71ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  dangerButton: {
    backgroundColor: '#ef476f',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  chipsWrap: {
    marginVertical: 6,
    maxHeight: 44
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cfd5ea',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#ecf1ff',
    borderColor: '#2648ff'
  },
  chipText: {
    color: '#4f566d'
  },
  chipTextActive: {
    color: '#2648ff',
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd5ea',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2648ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  secondaryButtonText: {
    color: '#2648ff',
    fontWeight: '600'
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f6'
  },
  listTitle: {
    fontWeight: '700'
  },
  muted: {
    color: '#6a7084',
    marginTop: 2,
    fontSize: 12
  },
  link: {
    color: '#2648ff',
    fontWeight: '600'
  }
});
