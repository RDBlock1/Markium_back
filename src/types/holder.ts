export interface HolderData {
  proxyWallet: string
  bio: string
  asset: string
  pseudonym: string
  amount: number
  displayUsernamePublic: boolean
  outcomeIndex: number // 0 = No, 1 = Yes
  name: string
  profileImage: string
  profileImageOptimized: string
}

export interface TokenHolders {
  tokenYes: string
  holdersYes: HolderData[]
  tokenNo: string
  holdersNo: HolderData[]

}

export interface HoldersResponse {
  data: TokenHolders[]
}
