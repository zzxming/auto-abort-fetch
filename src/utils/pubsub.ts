class PubSub {
    private static events = new WeakMap<object, Set<(...args: any[]) => void>>();
    private constructor() {}
    static subscribe(event: object, callback: (...args: any[]) => void) {
        let subscribers = PubSub.events.get(event);
        if (!subscribers) {
            subscribers = new Set();
        }
        subscribers.add(callback);
        PubSub.events.set(event, subscribers);
    }
    static unsubscribe(event: object, callback: (...args: any[]) => void) {
        const subscribers = PubSub.events.get(event);
        if (!subscribers) {
            return;
        }
        subscribers.delete(callback);
        PubSub.events.set(event, subscribers);
        if (subscribers.size === 0) {
            PubSub.events.delete(event);
        }
    }
    static publish(event: object, ...args: any[]) {
        const subscribers = PubSub.events.get(event);
        if (!subscribers) {
            return;
        }
        subscribers.forEach((callback) => {
            callback(...args);
        });
    }
}
