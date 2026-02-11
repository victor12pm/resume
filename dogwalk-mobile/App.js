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
  Alert
} from 'react-native';
import * as Location from 'expo-location';

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
  const [tab, setTab] = useState('track');
  const [currentRoute, setCurrentRoute] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedWalks, setSavedWalks] = useState([]);
  const [warningText, setWarningText] = useState('');
  const [warningCategory, setWarningCategory] = useState(warningCategories[0]);
  const [warnings, setWarnings] = useState([]);
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
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

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

  const stopTracking = () => {
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
      points: currentRoute
    };

    setSavedWalks((prev) => [walk, ...prev]);
    setCurrentRoute([]);
    setElapsedSeconds(0);
  };

  const addWarning = () => {
    if (!warningText.trim()) return;

    const latestPoint = currentRoute[currentRoute.length - 1];
    const warning = {
      id: Date.now().toString(),
      category: warningCategory,
      message: warningText.trim(),
      createdAt: new Date().toISOString(),
      source: latestPoint ? 'During current walk' : 'Manual report'
    };

    setWarnings((prev) => [warning, ...prev]);
    setWarningText('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>DogWalk Social MVP</Text>
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

      {tab === 'track' && (
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
      )}

      {tab === 'discover' && (
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
      )}

      {tab === 'social' && (
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
        </View>
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
  }
});
