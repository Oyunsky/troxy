// TODO: После удаление хоста очистка поля `proxy-input`

type StorageAreaT = browser.storage.StorageArea;
type TabT = browser.tabs.Tab;
type EventMessageT = Record<string, any>;
type SenderT = browser.runtime.MessageSender;
type RequestDetailsT = browser.proxy._OnRequestDetails;
type BlockingResponseT = browser.webRequest.BlockingResponse;

type MessageT = Record<string, unknown>;
type ProxyT = {username?: string, password?: string, ip?: string, port?: number};
type StateT = boolean;
type IgnoreListT = string[];

const STORAGE_LOCAL: StorageAreaT = browser.storage.local;
const STORAGE_SESSION: StorageAreaT = browser.storage.session;
const DEFAULT_IGNORE_LIST: IgnoreListT = ["127.0.0.1", "192.168.0.1", "localhost"];

async function send_message(message: MessageT) {
    try {
        await browser.runtime.sendMessage(message);
    } catch (error) {
        console.error("[send_message] error:", error, ":", message);
    }
}

async function set_storage_data(storage: StorageAreaT, data: object): Promise<boolean> {
    try {
        await storage.set(data);
        return true;
    } catch (error) {
        console.error("[set_storage_data] error:", error, ":", data);
        return false;
    }
}

async function get_storage_data<T>(storage: StorageAreaT, key: string): Promise<T | null> {
    try {
        const data = await storage.get(key);
        return key in data ? data[key] as T: null;
    } catch (error) {
        console.error("[get_storage_data] error:", error, ":", key);
        return null;
    }
}

async function get_storage_proxy(): Promise<ProxyT | null> {
    return await get_storage_data<ProxyT>(STORAGE_LOCAL, "proxy");
}

async function set_storage_proxy(proxy: ProxyT) {
    await set_storage_data(STORAGE_LOCAL, {proxy});
}

async function get_storage_state(): Promise<StateT | null> {
    return await get_storage_data<StateT>(STORAGE_SESSION, "state");
}

async function set_storage_state(state: StateT): Promise<void> {
    await set_storage_data(STORAGE_SESSION, {state});

    const icon_settings = {
        path: state ? "icons/48_on.png" : "icons/48_off.png"
    };
    await browser.browserAction.setIcon(icon_settings);
}

async function get_storage_ignore_list(): Promise<IgnoreListT> {
    return await get_storage_data<IgnoreListT>(STORAGE_LOCAL, "ignore_list") || DEFAULT_IGNORE_LIST;
}

async function set_storage_ignore_list(data: string | IgnoreListT): Promise<void> {
    const ignore_list: IgnoreListT = typeof data === "string"
            ? data.split(",").map(item => item.trim()).filter(Boolean)
            : data.map(item => item.trim()).filter(Boolean);
    await set_storage_data(STORAGE_LOCAL, {ignore_list});
}

async function push_storage_ignore_list(data: string): Promise<void> {
    const t_data = data.trim();
    if (!t_data) return;
    try {
        const ignore_list = new Set(await get_storage_ignore_list());
        ignore_list.add(t_data);
        await set_storage_ignore_list(Array.from(ignore_list));
    } catch (error) {
        console.error("[push_storage_ignore_list] error:", error);
    }
}

async function remove_storage_ignore_list(key: string): Promise<void> {
    const t_key = key.trim();
    if (!t_key) return;
    try {
        const ignore_list = await get_storage_ignore_list();
        const updated_list = ignore_list.filter(item => item !== t_key);
        await set_storage_ignore_list(updated_list);
    } catch (error) {
        console.error("[remove_storage_ignore_list] error:", error);
    }
}
