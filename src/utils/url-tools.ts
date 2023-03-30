export type Querys = {
    [k: string]: string | string[];
};

/** url splice querys */
export const jointQueryInputURL = (url: string, querys: Querys | undefined) => {
    let { protocol, hostname, port, path, fragment, query: originQuerys } = parseURL(url);
    let fullURL = `${protocol ? protocol + '://' : ''}${hostname}${port ? `:${port}` : ''}${path}`;
    if (!querys) querys = {};
    if (!Object.keys(querys).length && !Object.keys(originQuerys).length) {
        return fullURL;
    }
    fullURL += '?';

    for (let k in originQuerys) {
        let ov = originQuerys[k];
        let av = querys[k];
        let str = '';
        if (ov instanceof Array) {
            for (let i = 0; i < ov.length; i++) {
                if (ov[i]) {
                    str += `&${k}=${ov[i]}`;
                }
            }
        } else if (ov) {
            str += `&${k}=${ov}`;
        }

        if (av instanceof Array) {
            for (let i = 0; i < av.length; i++) {
                if (av[i]) {
                    str += `&${k}=${av[i]}`;
                }
            }
        } else if (av) {
            str += `&${k}=${av}`;
        }
        fullURL += str;
    }
    for (let k in querys) {
        if (!originQuerys[k]) {
            let av = querys[k];
            let str = '';
            if (av instanceof Array) {
                for (let i = 0; i < av.length; i++) {
                    str += `&${k}=${av[i]}`;
                }
            } else {
                str += `&${k}=${av}`;
            }
            fullURL += str;
        }
    }
    return `${fullURL}${fragment ? fragment : ''}`;
};

/** parse url */
export const parseURL = (url: string) => {
    url = url.trim();
    let protocol: string,
        hostname: string,
        port: string,
        path: string,
        query: {
            [k: string]: string | string[];
        } = {},
        fragment: string,
        fullPath = url;
    let [proHostPortPathFra, ...queryFra] = url.split('?');
    let queryArr: string[] = [];
    let preUrl = proHostPortPathFra;
    // 提取fragment
    if (queryFra.length) {
        let [queryStr, fragmentPath] = queryFra.join('?').split('#');
        fragment = fragmentPath ? `#${fragmentPath}` : '';
        queryArr = queryStr.split('&');
    } else {
        let [proHostPortPath, fragmentPath] = proHostPortPathFra.split('#');
        fragment = fragmentPath ? `#${fragmentPath}` : '';
        preUrl = proHostPortPath;
    }
    // 提取protocol
    let [protocolStr, hostPortPath] = preUrl.split('://');
    if (hostPortPath === undefined) {
        preUrl = protocolStr;
        protocol = '';
    } else {
        protocol = protocolStr;
        preUrl = hostPortPath;
    }
    // 截取path
    let [hostPort, ...pathArr] = preUrl.split('/');
    path = `/${pathArr.join('/')}`;
    // 截取hostname和port
    [hostname, port] = hostPort.split(':');
    // 获取query
    for (let str of queryArr) {
        if (str === '') continue;
        let [k, ...v] = str.split('=');
        let val = v.join('=');
        if (query[k]) {
            if (query[k] instanceof Array) {
                (query[k] as string[]).push(val);
            } else {
                query[k] = [query[k] as string, val];
            }
        } else {
            query[k] = val;
        }
    }
    return {
        protocol,
        hostname,
        port,
        path,
        query,
        fragment,
        fullPath,
    };
};
