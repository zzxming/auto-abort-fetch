import { autoAbortableFetch } from '../src/auto-abortable-fetch';
jest.mock('../src/auto-abortable-fetch');
const mockedFetch = jest.mocked(autoAbortableFetch);

describe('测试mock', () => {
    it('调用 autoAbortableFetch', () => {
        mockedFetch.mockReturnValue(
            Promise.resolve([
                {
                    headers: expect.any(Object),
                    status: 200,
                    success: true,
                    data: {
                        some: 'something',
                    },
                    statusText: 'OK',
                    url: 'http://localhost:8000/test',
                },
                undefined,
            ])
        );
        autoAbortableFetch({
            url: 'http://localhost:8000/test',
        }).then((res) => {
            expect(res).toEqual([
                {
                    headers: expect.any(Object),
                    status: 200,
                    success: true,
                    data: {
                        some: 'something',
                    },
                    statusText: 'OK',
                    url: 'http://localhost:8000/test',
                },
                undefined,
            ]);
        });
    });

    it('中断 autoAbortableFetch', () => {
        mockedFetch.mockReturnValue(
            Promise.reject([
                null,
                {
                    name: 'AbortError',
                    message: 'The user aborted a request.',
                },
            ])
        );

        autoAbortableFetch({
            url: 'http://localhost:8000/test/delay',
        }).catch((err) => {
            expect(err).toEqual([
                null,
                {
                    name: 'AbortError',
                    message: 'The user aborted a request.',
                },
            ]);
        });
    });

    it('调用两次 autoAbortableFetch', () => {
        mockedFetch.mockReturnValue(
            Promise.reject([
                null,
                {
                    name: 'AbortError',
                    message: 'The user aborted a request.',
                },
            ])
        );
        autoAbortableFetch({
            url: 'http://localhost:8000/test/delay',
        }).catch((err) => {
            expect(err).toEqual([
                null,
                {
                    name: 'AbortError',
                    message: 'The user aborted a request.',
                },
            ]);
        });
        mockedFetch.mockReturnValue(
            Promise.resolve([
                {
                    headers: expect.any(Object),
                    status: 200,
                    success: true,
                    data: {
                        some: 'something',
                    },
                    statusText: 'OK',
                    url: 'http://localhost:8000/test/delay',
                },
                undefined,
            ])
        );
        autoAbortableFetch({
            url: 'http://localhost:8000/test/delay',
        }).then((res) => {
            expect(res).toEqual([
                {
                    headers: expect.any(Object),
                    status: 200,
                    success: true,
                    data: {
                        some: 'something',
                    },
                    statusText: 'OK',
                    url: 'http://localhost:8000/test/delay',
                },
                undefined,
            ]);
        });
    });
});
