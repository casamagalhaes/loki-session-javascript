import { v4 as uuid } from 'uuid';

export function generateUniqueId() {
    return uuid();
}

export function storageGet(key: string) {
    if (window.localStorage) {
        return window.localStorage.getItem(key);
    }
    console.error('O browser não possui localStorage');
}

export function storageSet(key: string, value: any) {
    if (window.localStorage) {
        return window.localStorage.setItem(key, value);
    }
    console.error('O browser não possui localStorage');
}