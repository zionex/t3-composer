// @zionex/wingui-core/store/contentStore — 직접 path import 호환
import { create } from 'zustand';

export const useMenuStore = create(() => ({
    menuList: [],
    currentMenu: null,
    setMenuList: () => {},
}));

export const useContentStore = create(() => ({
    activeViewId: 'composer-standalone',
    viewList: [],
}));

export default { useMenuStore, useContentStore };
