import { jointQueryInputURL, parseURL } from '../src/utils/url-tools';

describe('测试 url 操作函数', () => {
    it('调用 parseURL', () => {
        expect(parseURL('www.baidu.com')).toEqual({
            protocol: '',
            hostname: 'www.baidu.com',
            port: undefined,
            path: '/',
            query: {},
            fragment: '',
            fullPath: 'www.baidu.com',
        });
        expect(parseURL('www.baidu.com:80')).toEqual({
            protocol: '',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/',
            query: {},
            fragment: '',
            fullPath: 'www.baidu.com:80',
        });
        expect(parseURL('http://www.baidu.com:80')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/',
            query: {},
            fragment: '',
            fullPath: 'http://www.baidu.com:80',
        });
        expect(parseURL('http://www.baidu.com:80/some/s?')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/some/s',
            query: {},
            fragment: '',
            fullPath: 'http://www.baidu.com:80/some/s?',
        });
        expect(parseURL('http://www.baidu.com:80/some/s?')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/some/s',
            query: {},
            fragment: '',
            fullPath: 'http://www.baidu.com:80/some/s?',
        });
        expect(parseURL('http://www.baidu.com:80/some/s?id=2&id=3&op=1')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/some/s',
            query: {
                id: ['2', '3'],
                op: '1',
            },
            fragment: '',
            fullPath: 'http://www.baidu.com:80/some/s?id=2&id=3&op=1',
        });
        expect(parseURL('http://www.baidu.com:80/some/s?id=2&id=3&op=1#/home/s')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/some/s',
            query: {
                id: ['2', '3'],
                op: '1',
            },
            fragment: '#/home/s',
            fullPath: 'http://www.baidu.com:80/some/s?id=2&id=3&op=1#/home/s',
        });
        expect(parseURL('http://www.baidu.com/some/s?id=2&id=3&op=1#/home/s')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: undefined,
            path: '/some/s',
            query: {
                id: ['2', '3'],
                op: '1',
            },
            fragment: '#/home/s',
            fullPath: 'http://www.baidu.com/some/s?id=2&id=3&op=1#/home/s',
        });
        expect(parseURL('http://www.baidu.com/some/s?#/home/s')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: undefined,
            path: '/some/s',
            query: {},
            fragment: '#/home/s',
            fullPath: 'http://www.baidu.com/some/s?#/home/s',
        });
        expect(parseURL('http://www.baidu.com:80/some/s#/home/s')).toEqual({
            protocol: 'http',
            hostname: 'www.baidu.com',
            port: '80',
            path: '/some/s',
            query: {},
            fragment: '#/home/s',
            fullPath: 'http://www.baidu.com:80/some/s#/home/s',
        });
    });

    it('调用 jointQueryInputURL', () => {
        expect(jointQueryInputURL('http://www.baidu.com?', {})).toEqual('http://www.baidu.com/');

        expect(jointQueryInputURL('http://www.baidu.com?name=123', {})).toEqual('http://www.baidu.com/?&name=123');

        expect(
            jointQueryInputURL('http://www.baidu.com', {
                name: '123',
            })
        ).toEqual('http://www.baidu.com/?&name=123');

        expect(
            jointQueryInputURL('http://www.baidu.com?id=13&id=2', {
                id: ['34', '42'],
                test: 'qqq',
            })
        ).toEqual('http://www.baidu.com/?&id=13&id=2&id=34&id=42&test=qqq');

        expect(
            jointQueryInputURL('www.baidu.com?id=13&id=2#/home', {
                id: ['34', '42'],
                test: 'qqq',
            })
        ).toEqual('www.baidu.com/?&id=13&id=2&id=34&id=42&test=qqq#/home');

        expect(
            jointQueryInputURL('www.baidu.com:80?id=13&id=2#/home', {
                id: ['34', '42'],
                test: 'qqq',
            })
        ).toEqual('www.baidu.com:80/?&id=13&id=2&id=34&id=42&test=qqq#/home');
    });
});
