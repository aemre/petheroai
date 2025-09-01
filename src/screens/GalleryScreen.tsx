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
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../store/store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserPhotos } from '../services/firebase';
import { deleteUserPhoto } from '../services/cloudFunctions';
import AnimatedGalleryItem from '../components/AnimatedGalleryItem';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t, isRTL } = useTranslation();
  
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
      Alert.alert(t('common.error'), t('errors.loadFailed'));
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

  const handleDeleteItem = (item: GalleryItem) => {
    Alert.alert(
      t('gallery.deleteConfirmTitle'),
      t('gallery.deleteConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('gallery.delete'),
          style: 'destructive',
          onPress: () => performDelete(item),
        },
      ],
      { cancelable: true }
    );
  };

  const performDelete = async (item: GalleryItem) => {
    try {
      console.log('Deleting photo:', item.id);
      await deleteUserPhoto(item.id);
      
      // Remove item from local state
      setGalleryItems(prev => prev.filter(photo => photo.id !== item.id));
      
      Alert.alert(t('common.success'), t('gallery.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert(t('common.error'), t('gallery.deleteError'));
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
      return t('gallery.today');
    } else if (diffInHours < 48) {
      return t('gallery.yesterday');
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} ${t('gallery.daysAgo')}`;
    }
  };

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <AnimatedGalleryItem
      item={item}
      itemSize={itemSize}
      onPress={handleItemPress}
      onDelete={handleDeleteItem}
      getThemeEmoji={getThemeEmoji}
      formatDate={formatDate}
    />
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, isRTL() && styles.emptyContainerRTL]}>
      <Text style={styles.emptyIcon}>🎨</Text>
      <Text style={[styles.emptyTitle, isRTL() && styles.textRTL]}>
        {t('gallery.empty')}
      </Text>
      <Text style={[styles.emptySubtitle, isRTL() && styles.textRTL]}>
        {t('gallery.emptySubtitle')}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={[styles.createButtonText, isRTL() && styles.textRTL]}>
          {t('gallery.createButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#FDF4FF', '#FCE7F3', '#F9A8D4']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={[styles.loadingText, isRTL() && styles.textRTL]}>
          {t('common.loading')}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDF4FF', '#FCE7F3', '#F9A8D4']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, isRTL() && styles.backButtonRTL]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>{isRTL() ? '→' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isRTL() && styles.textRTL]}>
            {t('gallery.title')}
          </Text>
          <Text style={[styles.subtitle, isRTL() && styles.textRTL]}>
            {t('gallery.subtitle')}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={galleryItems}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.galleryContainer,
          galleryItems.length === 0 && styles.galleryContainerEmpty
        ]}
        style={styles.flatList}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      
      {/* Bottom swipe instruction */}
      {galleryItems.length > 0 && (
        <View style={styles.bottomInstruction}>
          <Text style={[styles.instructionText, isRTL() && styles.textRTL]}>
            {t('gallery.swipeRight')}
          </Text>
        </View>
      )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  flatList: {
    flex: 1,
  },
  galleryContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  galleryContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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
  textRTL: {
    textAlign: 'right',
  },
  backButtonRTL: {
    transform: [{ scaleX: -1 }],
  },
  emptyContainerRTL: {
    alignItems: 'flex-end',
  },
  bottomInstruction: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
