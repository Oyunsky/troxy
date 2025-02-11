type StorageAreaT = browser.storage.StorageArea;
type TabT = browser.tabs.Tab;
type EventMessageT = Record<string, any>;
type SenderT = browser.runtime.MessageSender;
type RequestDetailsT = browser.proxy._OnRequestDetails;
type BlockingResponseT = browser.webRequest.BlockingResponse;

type MessageT = Record<string, unknown>;
type ProxyT = { username?: string; password?: string; ip?: string; port?: number };
type StateT = boolean;
type IgnoreListT = string[];

const STORAGE_LOCAL: StorageAreaT = browser.storage.local;
const STORAGE_SESSION: StorageAreaT = browser.storage.session;

const storage_set_data = async (storage: StorageAreaT, data: object): Promise<boolean> => {
    try {
        await storage.set(data);
        return true;
    } catch (error) {
        console.error("[storage_set_data] error:", error, data);
        return false;
    }
};

const storage_get_data = async <T>(storage: StorageAreaT, key: string): Promise<T | null> => {
    try {
        const data = await storage.get(key);
        return key in data ? (data[key] as T) : null;
    } catch (error) {
        console.error("[storage_get_data] error:", error, key);
        return null;
    }
};

const storage_get_proxy = async (): Promise<ProxyT | null> => storage_get_data<ProxyT>(STORAGE_LOCAL, "proxy");
const storage_set_proxy= async (proxy: ProxyT): Promise<boolean> => storage_set_data(STORAGE_LOCAL, {proxy});

const storage_get_state = async (): Promise<StateT | null> => storage_get_data<StateT>(STORAGE_SESSION, "state");

const storage_set_state = async (state: StateT): Promise<boolean> => {
    const iconSettings = {
        path: state ? "icons/48_on.png" : "icons/48_off.png",
    };
    await browser.browserAction.setIcon(iconSettings);
    return await storage_set_data(STORAGE_SESSION, {state});
};

const storage_get_ignore_hosts = async (): Promise<IgnoreListT | null> => storage_get_data<IgnoreListT>(STORAGE_LOCAL, "ignore_hosts");

const storage_set_ignore_hosts = async (data: string | IgnoreListT): Promise<void> => {
    const ignore_hosts: IgnoreListT = (typeof data === "string" ? data.split(",") : data)
        .map((item) => item.trim())
        .filter(Boolean);
    await storage_set_data(STORAGE_LOCAL, {ignore_hosts});
};

const storage_push_ignore_host = async (data: string): Promise<void> => {
    const t_data = data.trim();
    if (!t_data) return;
    try {
        const ignore_hosts = new Set(await storage_get_ignore_hosts());
        ignore_hosts.add(t_data);
        await storage_set_ignore_hosts(Array.from(ignore_hosts));
    } catch (error) {
        console.error("[storage_push_ignore_host] error:", error);
    }
};

const storage_remove_ignore_host = async (key: string): Promise<void> => {
    const t_key = key.trim();
    if (!t_key) return;
    try {
        const ignore_hosts = await storage_get_ignore_hosts() || [];
        const updated_hosts = ignore_hosts.filter((item) => item !== t_key);
        await storage_set_ignore_hosts(updated_hosts);
    } catch (error) {
        console.error("[storage_remove_ignore_host ] error:", error);
    }
};
