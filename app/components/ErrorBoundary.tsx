import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface State { hasError: boolean; error: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error) {
    console.log('ErrorBoundary caught:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1628' }}>
          <Text style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>Something went wrong</Text>
          <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 24 }}>{this.state.error}</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false, error: '' })}>
            <Text style={{ color: '#1A6FFF' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
