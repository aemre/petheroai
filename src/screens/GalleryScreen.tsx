import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../store/store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserPhotos } from '../services/firebase';

type GalleryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Gallery'>;

const { width } = Dimensions.get('window');
const itemSize = (width - 48) / 2; // 2 columns with padding

interface GalleryItem {
  id: string;
  originalUrl: string;
  resultUrl: string;
  theme: string;
  createdAt: string;
  status: 'processing' | 'done' | 'error';
}

export default function GalleryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      console.log('Loading gallery for user:', user.uid);
      
      const photos = await getUserPhotos(user.uid);
      
      const galleryData: GalleryItem[] = photos.map((photo: any) => ({
        id: photo.id,
        originalUrl: photo.originalUrl,
        resultUrl: photo.resultUrl,
        theme: photo.theme,
        createdAt: photo.createdAt,
        status: photo.status,
      }));
      
      console.log(`Loaded ${galleryData.length} photos`);
      setGalleryItems(galleryData);
    } catch (error) {
      console.error('Error loading gallery:', error);
      Alert.alert('Error', 'Failed to load your gallery');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGalleryItems();
    setRefreshing(false);
  };

  const handleItemPress = (item: GalleryItem) => {
    if (item.status === 'done') {
      navigation.navigate('Result', { photoId: item.id });
    } else if (item.status === 'processing') {
      navigation.navigate('Processing', { photoId: item.id });
    }
  };

  const getThemeEmoji = (theme: string): string => {
    const themeEmojis: { [key: string]: string } = {
      'superhero with cape flying through the sky': '🦸‍♀️',
      'medieval knight in shining armor': '⚔️',
      'space astronaut exploring distant planets': '🚀',
      'fantasy wizard casting magical spells': '🧙‍♂️',
      'pirate captain sailing the seven seas': '🏴‍☠️',
      'ninja warrior in stealth mode': '🥷',
      'cowboy sheriff in the wild west': '🤠',
      'ancient gladiator in the colosseum': '🏛️',
      'steampunk inventor with mechanical gadgets': '⚙️',
      'cyber warrior in a futuristic world': '🤖',
      'royal king or queen with crown and robe': '👑',
      'detective with magnifying glass and coat': '🔍',
      'firefighter hero saving the day': '🚒',
      'arctic explorer in winter gear': '🧊',
      'jungle adventurer with safari equipment': '🌿',
    };
    return themeEmojis[theme] || '🦸‍♀️';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.imageContainer}>
        {item.status === 'processing' && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        {item.status === 'error' && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>❌</Text>
          </View>
        )}
        <Image
          source={{ uri: item.status === 'done' ? item.resultUrl : item.originalUrl }}
          style={styles.galleryImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.themeText}>
          {getThemeEmoji(item.theme)} {item.theme.split(' ').slice(0, 3).join(' ')}...
        </Text>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎨</Text>
      <Text style={styles.emptyTitle}>No Hero Images Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first pet hero transformation to see it here!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.createButtonText}>Create Your First Hero</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your gallery...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🖼️ Your Hero Gallery</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={galleryItems}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.galleryContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  galleryContainer: {
    padding: 16,
  },
  galleryItem: {
    width: itemSize,
    marginBottom: 16,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: itemSize,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  errorOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,0,0,0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
  },
  itemInfo: {
    padding: 12,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
