export const PRODUCT_IDS = {
  explorer_plus: 'com.tripmatess.app.explorer_plus_monthly',
  voyager: 'com.tripmatess.app.voyager_monthly',
  premium: 'com.tripmatess.app.premium_monthly',
}

export async function initIAP() {
  const IAP = require('expo-in-app-purchases')
  await IAP.connectAsync()
}

export async function getProducts() {
  const IAP = require('expo-in-app-purchases')
  const { results } = await IAP.getProductsAsync(Object.values(PRODUCT_IDS))
  return results ?? []
}

export async function purchaseProduct(productId: string) {
  const IAP = require('expo-in-app-purchases')
  await IAP.purchaseItemAsync(productId)
}

export async function restorePurchases() {
  const IAP = require('expo-in-app-purchases')
  await IAP.getPurchaseHistoryAsync()
}
