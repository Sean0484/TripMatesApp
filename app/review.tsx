import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../lib/supabase'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function ReviewScreen() {
  const router = useRouter()
  const { revieweeId, revieweeName } = useLocalSearchParams<{
    revieweeId: string
    revieweeName: string
  }>()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Select a rating', 'Please tap the stars to rate.')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (user.id === revieweeId) {
        Alert.alert('Not allowed', 'You cannot review yourself.')
        setLoading(false)
        return
      }
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('author_id', user.id)
        .eq('subject_id', revieweeId)
        .single()

      let error
      if (existing) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ rating, comment: comment.trim() || null })
          .eq('id', existing.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('reviews')
          .insert({ author_id: user.id, subject_id: revieweeId, rating, comment: comment.trim() || null })
        error = insertError
      }
      if (error) throw error
      Alert.alert('Review submitted!', 'Thank you for your feedback.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Leave a Review</Text>
        <Text style={styles.subheading}>for {revieweeName ?? 'this traveller'}</Text>

        <Text style={styles.fieldLabel}>YOUR RATING</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Text style={[styles.star, star <= rating && styles.starFilled]}>
                {star <= rating ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
        )}

        <Text style={[styles.fieldLabel, { marginTop: 28 }]}>COMMENT (OPTIONAL)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience with this traveller..."
          placeholderTextColor="#4b5563"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={styles.charCount}>{comment.length}/300</Text>

        <TouchableOpacity
          style={[styles.submitBtnWrap, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1A6FFF', '#0A4CC9']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>Submit Review</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  subheading: { fontSize: 15, color: '#6b7280', marginBottom: 36 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    letterSpacing: 1, marginBottom: 12,
  },
  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  star: { fontSize: 44, color: '#374151' },
  starFilled: { color: '#f59e0b' },
  ratingLabel: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
  commentInput: {
    backgroundColor: '#0D2040', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 14, height: 120,
  },
  charCount: { color: '#374151', fontSize: 12, textAlign: 'right', marginTop: 6, marginBottom: 32 },
  submitBtnWrap: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitBtn: { paddingVertical: 17, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
