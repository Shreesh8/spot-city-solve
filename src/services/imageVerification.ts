import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
}

interface CacheEntry {
  result: VerificationResult;
  timestamp: number;
}

export class ImageVerificationService {
  private static classifier: any = null;
  private static isInitializing = false;
  private static initialized = false;
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static async initializeClassifier() {
    if (this.initialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    try {
      console.log('Initializing optimized image classifier...');
      // Use faster, more accurate model
      this.classifier = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch16', // Better accuracy with patch16
        { 
          device: 'webgpu',
          dtype: 'fp16' // Faster inference
        }
      );
      this.initialized = true;
      console.log('Image classifier initialized successfully with optimizations');
    } catch (error) {
      console.error('Failed to initialize classifier:', error);
      // Fallback to CPU with optimizations
      try {
        this.classifier = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch16'
        );
        this.initialized = true;
        console.log('Image classifier initialized with CPU fallback');
      } catch (fallbackError) {
        console.error('Failed to initialize classifier with CPU fallback:', fallbackError);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  static async preload(): Promise<boolean> {
    await this.initializeClassifier();
    return !!this.classifier;
  }

  static isReady(): boolean {
    return this.initialized && !!this.classifier;
  }

  private static generateCacheKey(imageDataUrl: string, description: string, category: string): string {
    // Create a hash-like key from the inputs
    const content = `${category}:${description}:${imageDataUrl.slice(0, 100)}`;
    return btoa(content).slice(0, 32);
  }

  private static cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  private static generateLabels(description: string, category: string): string[] {
    // Enhanced category labels with more specific terms
    const categoryLabels: { [key: string]: string[] } = {
      'road_damage': [
        'damaged road', 'pothole', 'cracked pavement', 'broken asphalt', 'road repair needed',
        'street damage', 'road surface', 'pavement crack', 'asphalt hole', 'road defect'
      ],
      'sanitation': [
        'garbage', 'trash', 'dirty area', 'waste', 'litter', 'unsanitary conditions',
        'refuse', 'rubbish', 'debris', 'contamination', 'filthy environment'
      ],
      'lighting': [
        'broken light', 'dark street', 'faulty streetlight', 'lighting issue', 'lamp not working',
        'street lamp', 'public lighting', 'illumination problem', 'light fixture', 'outdoor lighting'
      ],
      'graffiti': [
        'graffiti', 'vandalism', 'painted wall', 'spray paint', 'defaced property',
        'wall art', 'illegal marking', 'property damage', 'unauthorized painting', 'wall defacement'
      ],
      'sidewalk': [
        'damaged sidewalk', 'broken walkway', 'cracked pavement', 'pedestrian path issue',
        'walkway damage', 'pavement problem', 'sidewalk crack', 'pedestrian area', 'pathway issue'
      ],
      'vegetation': [
        'overgrown plants', 'tree issue', 'landscaping problem', 'vegetation maintenance',
        'overgrown vegetation', 'tree damage', 'plant overgrowth', 'landscape maintenance', 'green space issue'
      ],
      'other': [
        'infrastructure issue', 'municipal problem', 'public facility issue',
        'urban problem', 'city infrastructure', 'public maintenance issue'
      ]
    };

    const specificLabels = categoryLabels[category] || categoryLabels['other'];
    
    // Smarter description parsing
    const descriptionWords = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
    
    // Take more relevant words and create compound labels
    const keyWords = descriptionWords.slice(0, 5);
    const compoundLabels = keyWords.map(word => `${category.replace('_', ' ')} ${word}`);
    
    // Optimized negative labels
    const negativeLabels = [
      'person face', 'selfie photo', 'indoor room', 'food item', 'animal pet', 
      'unrelated content', 'random image', 'screenshot text', 'social media', 'meme image'
    ];

    return [...specificLabels, ...keyWords, ...compoundLabels, ...negativeLabels];
  }

  static async verifyImage(
    imageDataUrl: string, 
    description: string, 
    category: string
  ): Promise<VerificationResult> {
    try {
      // Clean old cache entries
      this.cleanCache();
      
      // Check cache first for faster response
      const cacheKey = this.generateCacheKey(imageDataUrl, description, category);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('Using cached verification result');
        return cached.result;
      }

      await this.initializeClassifier();
      
      if (!this.classifier) {
        return {
          isValid: false,
          confidence: 0,
          reason: 'Image verification unavailable'
        };
      }

      const labels = this.generateLabels(description, category);
      console.log('Verifying image with enhanced labels:', labels.slice(0, 15)); // Log first 15 for debugging

      const result = await this.classifier(imageDataUrl, labels);
      console.log('Classification result:', result.slice(0, 5)); // Log top 5 results

      // Enhanced scoring with weighted categories
      const categorySpecificLabels = labels.slice(0, 10); // First 10 are category-specific
      const keywordLabels = labels.slice(10, 15); // Next 5 are keywords
      const compoundLabels = labels.slice(15, 20); // Next 5 are compound labels
      const negativeLabels = labels.slice(-10); // Last 10 are negative

      // Calculate weighted scores
      const categoryMatches = result.filter((item: any) => categorySpecificLabels.includes(item.label));
      const keywordMatches = result.filter((item: any) => keywordLabels.includes(item.label));
      const compoundMatches = result.filter((item: any) => compoundLabels.includes(item.label));
      const negativeMatches = result.filter((item: any) => negativeLabels.includes(item.label));

      // Weight different types of matches
      const categoryScore = Math.max(...categoryMatches.map(m => m.score), 0) * 1.0;
      const keywordScore = Math.max(...keywordMatches.map(m => m.score), 0) * 0.8;
      const compoundScore = Math.max(...compoundMatches.map(m => m.score), 0) * 0.9;
      const negativeScore = Math.max(...negativeMatches.map(m => m.score), 0);

      const positiveScore = Math.max(categoryScore, keywordScore, compoundScore);
      
      // Dynamic threshold based on category complexity
      const complexCategories = ['graffiti', 'vegetation', 'other'];
      const threshold = complexCategories.includes(category) ? 0.12 : 0.18;
      
      // Enhanced validation logic
      const isValid = positiveScore > negativeScore && 
                     positiveScore > threshold && 
                     (positiveScore - negativeScore) > 0.05; // Margin requirement

      const bestPositiveMatch = [
        ...categoryMatches,
        ...keywordMatches,
        ...compoundMatches
      ].sort((a, b) => b.score - a.score)[0];

      const bestNegativeMatch = negativeMatches.sort((a, b) => b.score - a.score)[0];

      const verificationResult: VerificationResult = {
        isValid,
        confidence: Math.round(positiveScore * 100),
        reason: isValid 
          ? `Image matches "${bestPositiveMatch?.label}" with ${Math.round(positiveScore * 100)}% confidence`
          : negativeScore > positiveScore
            ? `Image appears to be "${bestNegativeMatch?.label}" (${Math.round(negativeScore * 100)}%) which is not relevant`
            : `Image confidence too low (${Math.round(positiveScore * 100)}%) for category "${category}"`
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result: verificationResult,
        timestamp: Date.now()
      });

      return verificationResult;
    } catch (error) {
      console.error('Image verification error:', error);
      return {
        isValid: false,
        confidence: 0,
        reason: 'Verification failed - please try again'
      };
    }
  }
}