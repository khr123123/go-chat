import {create} from "zustand"

export type UserInfo = {
    id: string
    email?: string
    phone?: string
    created_at: string
    updated_at?: string
    last_sign_in_at?: string
    email_confirmed_at?: string
    avatar_url?: string
    bio?: string
    displayname?: string
}

type UserStore = {
    user: UserInfo
    loading: boolean

    setUser: (user: UserInfo) => void
    updateUser: (data: Partial<UserInfo>) => void
    setLoading: (loading: boolean) => void
    clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
    // 登录后才会设置，这里先给一个初始值
    user: {
        id: "",
        email: "",
        phone: "",
        created_at: "",
        updated_at: "",
        last_sign_in_at: "",
        email_confirmed_at: "",
        avatar_url: "",
        bio: "",
        displayname: "",
    },

    loading: true,

    setUser: (user) => set({user}),

    updateUser: (data) =>
        set((state) => ({
            user: {
                ...state.user,
                ...data,
            },
        })),

    setLoading: (loading) => set({loading}),

    clearUser: () =>
        set({
            user: {
                id: "",
                email: "",
                phone: "",
                created_at: "",
                updated_at: "",
                last_sign_in_at: "",
                email_confirmed_at: "",
                avatar_url: "",
                bio: "",
                displayname: "",
            },
            loading: false,
        }),
}))