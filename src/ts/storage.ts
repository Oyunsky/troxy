type StorageAreaT = browser.storage.StorageArea;
type TabT = browser.tabs.Tab;
type EventMessageT = Record<string, any>;
type SenderT = browser.runtime.MessageSender;
type RequestDetailsT = browser.proxy._OnRequestDetails;

type MessageT = Record<string, unknown>;
type ProxyT = {username?: string, password?: string, ip?: string, port?: number};
type StateT = boolean;
type IgnoreListT = Array<string>;

const STORAGE_LOCAL: StorageAreaT = browser.storage.local;
const STORAGE_SESSION: StorageAreaT = browser.storage.session;
const DEFAULT_IGNORE_LIST: IgnoreListT = ["127.0.0.1", "192.168.0.1", "localhost"];

async function send_message(message: MessageT) {
    try {
        await browser.runtime.sendMessage(message);
        console.debug("Sended message", message);
    } catch (error) {
        console.error("Error sending message", message, ":", error);
    }
}

async function set_storage_data(storage: StorageAreaT, data: object): Promise<boolean> {
    try {
        await storage.set(data);
        return true;
    } catch (error) {
        console.error("Error saving data", data, ":", error);
        return false;
    }
}

async function get_storage_data<T extends unknown>(
    storage: StorageAreaT, key: string
): Promise<T | null> {
    try {
        const data = await storage.get(key);
        return key in data ? data[key] as T: null;
    } catch (error) {
        console.error(`Error getting data with key ${key}:`, error);
        return null;
    }
}

async function get_storage_proxy(): Promise<ProxyT | null> {
    return await get_storage_data(STORAGE_LOCAL, "proxy");
}

function set_storage_proxy(proxy: ProxyT) {
    set_storage_data(STORAGE_LOCAL, {proxy});
}

async function get_storage_state(): Promise<StateT | null> {
    return await get_storage_data(STORAGE_SESSION, "state");
}

function set_storage_state(state: StateT) {
    set_storage_data(STORAGE_SESSION, {state});

    const icon_settings = {
        path: state ? "icons/48_on.png" : "icons/48_off.png"
    };
    browser.browserAction.setIcon(icon_settings);
}

async function get_storage_ignore_list(): Promise<IgnoreListT | null> {
    return await get_storage_data(STORAGE_LOCAL, "ignore_list");
}

function set_storage_ignore_list(data: string | IgnoreListT) {
    const ignore_list: IgnoreListT =
        typeof data === "string"
            ? data.split(",").map(item => item.trim()).filter(item => item !== "")
            : data.map(item => item.trim()).filter(item => item !== "");
    set_storage_data(STORAGE_LOCAL, {ignore_list});
}
