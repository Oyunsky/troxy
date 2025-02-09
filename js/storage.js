const STORAGE_LOCAL = browser.storage.local;
const STORAGE_SESSION = browser.storage.session;
const DEFAULT_IGNORE_LIST = ["localhost", "127.0.0.1", "192.168.0.1"]

async function send_message(message) {
    try {
        await browser.runtime.sendMessage(message);
    } catch (error) {
        console.error("Error sending  message", message, ":", error);
    }
}

async function set_storage_data(storage, data) {
    try {
        await storage.set(data);
        return true;
    } catch (error) {
        console.error("Error saving data", data, ":", error);
        return false;
    }
}

async function get_storage_data(storage, key) {
    try {
        const data = await storage.get(key);
        return key in data ? data[key] : null;
    } catch (error) {
        console.error(`Error getting data with key '${key}':`, error);
        return null;
    }
}

async function get_storage_proxy() {
    return await get_storage_data(STORAGE_LOCAL, "proxy") || null;
}

function set_storage_proxy(proxy) {
    set_storage_data(STORAGE_LOCAL, {proxy});
}

async function get_storage_state() {
    return await get_storage_data(STORAGE_SESSION, "state") || null;
}

function set_storage_state(state) {
    set_storage_data(STORAGE_SESSION, {state});

    const icon_settings = {
        path: state ? "icons/48_on.png" : "icons/48_off.png"
    };
    browser.browserAction.setIcon(icon_settings);
}

async function get_storage_ignore_list() {
    return await get_storage_data(STORAGE_LOCAL, "ignore_list") || null;
}

function set_storage_ignore_list(data) {
    if (typeof data === "string") {
        data = data.trim();
        data = data ? data.split(",") : [];
    } else if (!Array.isArray(data)) {
        return;
    }

    const ignore_list = data
        .map(item => item.trim())
        .filter(item => item !== "");

    set_storage_data(STORAGE_LOCAL, {ignore_list});
}
