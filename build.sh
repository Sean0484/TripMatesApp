#!/bin/bash

set -e

mkdir -p "$HOME/Desktop/Tripmatess"

echo "🚀 Starting Tripmates TestFlight build..."

# Get current build number and increment
CURRENT=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/Tripmates/Info.plist)
NEW=$((CURRENT + 1))

echo "📦 Bumping build number: $CURRENT → $NEW"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW" ios/Tripmates/Info.plist

ARCHIVE_PATH="$HOME/Desktop/Tripmatess/Tripmates$NEW.xcarchive"
EXPORT_PATH="$HOME/Desktop/Tripmatess/TripMatesExport$NEW"

echo "🔨 Archiving..."
xcodebuild -workspace ios/Tripmates.xcworkspace \
  -scheme Tripmates \
  -configuration Release \
  -destination generic/platform=iOS \
  archive \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution: Tripmates IS (2V9DS778KQ)" \
  PROVISIONING_PROFILE_SPECIFIER="Tripmates App Store Distribution" \
  | grep -E "error:|warning:|ARCHIVE SUCCEEDED|ARCHIVE FAILED"

echo "📤 Exporting..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist ios/ExportOptions.plist \
  | grep -E "error:|EXPORT SUCCEEDED|EXPORT FAILED"

echo "☁️ Uploading to TestFlight..."
xcrun altool --upload-app \
  -f "$EXPORT_PATH/Tripmates.ipa" \
  -t ios \
  --apiKey 3H56K55P95 \
  --apiIssuer 15074468-9877-4890-8b27-6295e3eb442a

echo "✅ Done! Build $NEW uploaded to TestFlight!"
