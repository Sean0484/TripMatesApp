import Purchases, { PurchasesPackage } from 'react-native-purchases'

const REVENUECAT_API_KEY = 'appl_test_cGjkwPajtgvrhujPSFATnAFRHbJ'

export async function initIAP() {
  Purchases.configure({ apiKey: REVENUECAT_API_KEY })
}

export async function getProducts(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings()
  return offerings.current?.availablePackages ?? []
}

export async function purchaseProduct(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  return customerInfo
}

export async function restorePurchases() {
  return await Purchases.restorePurchases()
}
