import * as InAppPurchases from 'expo-in-app-purchases'

export const PRODUCT_IDS = {
  explorer_plus: 'com.tripmatess.app.explorer_plus_monthly',
  voyager: 'com.tripmatess.app.voyager_monthly',
  premium: 'com.tripmatess.app.premium_monthly',
}

export async function initIAP() {
  await InAppPurchases.connectAsync()
}

export async function getProducts() {
  const { results } = await InAppPurchases.getProductsAsync(Object.values(PRODUCT_IDS))
  return results ?? []
}

export async function purchaseProduct(productId: string) {
  await InAppPurchases.purchaseItemAsync(productId)
}

export async function restorePurchases() {
  await InAppPurchases.getPurchaseHistoryAsync()
}
