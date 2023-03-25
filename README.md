# auto-abort-fetch.js

## Pre-requisites

You can use it on Node 17.5.0 (or later) or a browser version that supports fetch.

## Usage

```js
let [res, err] = await autoAbortableFetch({
    url: 'https://xxx',
    method: 'get',
    headers: {},
    timeout: 5000,
    querys: {},
    data: {},
    responseType: 'json',
});
let { headers, success, data, status, statusText } = res;
let { name, message } = err;

// If you want to manually control the fetch abort, you can pass AbortControl.signal

let controller = new AbortController();
let signal = controller.signal;
let [res, err] = await autoAbortableFetch({
    url: 'https://xxx',
    signal,
});
```

## TypeScript usage

```ts
interface ResponseData {
    message: string;
}

let [res, err] = await autoAbortableFetch<ResponseData>({ url: 'https://xxx' });
console.log(res.data.message);
```
