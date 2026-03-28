import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:4000/api',
    withCredentials: true
});

const listeners = new Set();
let activeRequests = 0;
let loadingVisible = false;
let showTimer = null;

const notifyListeners = () => {
    listeners.forEach((listener) => listener(loadingVisible));
};

const setLoadingVisible = (visible) => {
    if (loadingVisible === visible) return;
    loadingVisible = visible;
    notifyListeners();
};

const beginLoading = () => {
    activeRequests += 1;

    if (activeRequests === 1) {
        showTimer = setTimeout(() => {
            setLoadingVisible(true);
        }, 350);
    }
};

const endLoading = () => {
    activeRequests = Math.max(0, activeRequests - 1);

    if (activeRequests === 0) {
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }
        setLoadingVisible(false);
    }
};

instance.interceptors.request.use(
    (config) => {
        const shouldTrack = !config?.skipGlobalLoading;
        config.__trackGlobalLoading = shouldTrack;

        if (shouldTrack) beginLoading();

        return config;
    },
    (error) => {
        endLoading();
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        if (response?.config?.__trackGlobalLoading) {
            endLoading();
        }
        return response;
    },
    (error) => {
        if (error?.config?.__trackGlobalLoading) {
            endLoading();
        }
        return Promise.reject(error);
    }
);

export const subscribeNetworkLoading = (listener) => {
    listeners.add(listener);
    listener(loadingVisible);

    return () => {
        listeners.delete(listener);
    };
};

export default instance