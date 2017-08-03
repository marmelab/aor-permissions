import expect, { createSpy } from 'expect';

import {
    defaultApplyPermissionsToAction,
    defaultApplyPermissionsToResource,
    applyPermissionsToResources,
} from './Admin';

describe('<Admin>', () => {
    describe('defaultApplyPermissionsToAction', () => {
        it('resolves to the action component if no permissions attributes are defined', async () => {
            const result = await defaultApplyPermissionsToAction({
                permissions: [],
                resource: { props: { list: 'listComponent' } },
                action: 'list',
            });

            expect(result).toEqual('listComponent');
        });

        it('resolves to the action component if permissions attributes are defined and resolvePermission matches', async () => {
            const resolvePermission = createSpy().andReturn(() => Promise.resolve({ matched: true }));

            const result = await defaultApplyPermissionsToAction({
                permissions: [],
                resource: { props: { list: 'listComponent', listPermissions: 'foo' } },
                action: 'list',
                resolvePermission,
            });

            expect(result).toEqual('listComponent');
        });

        it('resolves to null if permissions attributes are defined and resolvePermission does not match', async () => {
            const resolvePermission = createSpy().andReturn(() => Promise.resolve({ matched: false }));

            const result = await defaultApplyPermissionsToAction({
                permissions: [],
                resource: { props: { list: 'listComponent', listPermissions: 'foo' } },
                action: 'list',
                resolvePermission,
            });

            expect(result).toEqual(null);
        });
    });

    describe('defaultApplyPermissionsToResource', () => {
        it('resolves to the resource if no permissions attributes are defined', async () => {
            const authClient = createSpy().andReturn(Promise.resolve('foo'));
            const result = await defaultApplyPermissionsToResource({
                authClient,
                resource: {
                    props: {
                        name: 'aResource',
                        icon: 'anIcon',
                        options: 'someOptions',
                        checkCredentials: 'doesCheckCredentials',
                        list: 'listComponent',
                        create: 'createComponent',
                        edit: 'editComponent',
                        show: 'showComponent',
                        remove: 'removeComponent',
                    },
                },
            });

            expect(result).toEqual({
                name: 'aResource',
                icon: 'anIcon',
                options: 'someOptions',
                checkCredentials: 'doesCheckCredentials',
                list: 'listComponent',
                create: 'createComponent',
                edit: 'editComponent',
                show: 'showComponent',
                remove: 'removeComponent',
            });
        });

        it('resolves to the resource with filtered actions if permissions attributes are defined', async () => {
            const authClient = createSpy().andReturn(Promise.resolve(['list', 'show']));
            const result = await defaultApplyPermissionsToResource({
                authClient,
                resource: {
                    props: {
                        name: 'aResource',
                        icon: 'anIcon',
                        options: 'someOptions',
                        checkCredentials: 'doesCheckCredentials',
                        list: 'listComponent',
                        listPermissions: 'list',
                        create: 'createComponent',
                        createPermissions: 'foo',
                        edit: 'editComponent',
                        editPermissions: 'foo',
                        show: 'showComponent',
                        showPermissions: 'show',
                        showResolve: () => Promise.resolve(false),
                        remove: 'removeComponent',
                        removePermissions: 'foo',
                        removeResolve: () => true,
                    },
                },
            });

            expect(result).toEqual({
                name: 'aResource',
                icon: 'anIcon',
                options: 'someOptions',
                checkCredentials: 'doesCheckCredentials',
                list: 'listComponent',
                create: null,
                edit: null,
                show: null,
                remove: 'removeComponent',
            });
        });

        it('resolves to false if permissions attribute is defined and resolvePermission does not match', async () => {
            const authClient = createSpy().andReturn(Promise.resolve('foo'));
            const resolvePermission = createSpy().andReturn(() => Promise.resolve({ matched: false }));
            const result = await defaultApplyPermissionsToResource({
                authClient,
                resource: { props: { permissions: 'bar' } },
                resolvePermission,
            });

            expect(result).toEqual(false);
        });
    });

    describe('applyPermissionsToResources', () => {
        it('resolves to filtered resources', async () => {
            const applyPermissionsToResource = createSpy().andCall(
                ({ resource }) => (resource === 'resource1' ? resource : false),
            );

            const resources = await applyPermissionsToResources({
                authClient: 'authClientImpl',
                resources: ['resource1', 'resource2'],
                applyPermissionsToResource,
            });

            expect(resources).toEqual(['resource1']);
            expect(applyPermissionsToResource).toHaveBeenCalledWith({
                authClient: 'authClientImpl',
                resource: 'resource1',
            });
            expect(applyPermissionsToResource).toHaveBeenCalledWith({
                authClient: 'authClientImpl',
                resource: 'resource2',
            });
        });
    });
});
