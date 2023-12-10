import { create } from "zustand";

const useStore = create((set) => ({
  username: "",
  setUsername: (username) => set({ username }),
}));

export default useStore;
