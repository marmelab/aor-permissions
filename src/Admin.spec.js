import expect, { createSpy } from 'expect';
import React from 'react';
import { shallow } from 'enzyme';
import { Resource } from 'admin-on-rest';

import Admin, {
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
                edit: 'editComponent',
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

    it('pass back all additional resources props', () => {
        const authClient = () => Promise.resolve('user');
        const wrapper = shallow(
            <Admin authClient={authClient}>
                <Resource name="posts" customProp="value1" customProp2="value2" />
                <Resource name="comments" customProp="value3" customProp2="value4" />
                <Resource name="users" permissions="admin" customProp="value1" customProp2="value2" />
            </Admin>,
        );

        return new Promise(resolve => {
            // We need a timeout here because of the asynchronous call to the authClient
            setTimeout(() => {
                expect(wrapper.find(Resource).length).toEqual(2);
                const postsResource = wrapper.find(Resource).at(0);
                expect(postsResource.prop('name')).toEqual('posts');
                expect(postsResource.prop('customProp')).toEqual('value1');
                expect(postsResource.prop('customProp2')).toEqual('value2');

                const commentsResource = wrapper.find(Resource).at(1);
                expect(commentsResource.prop('name')).toEqual('comments');
                expect(commentsResource.prop('customProp')).toEqual('value3');
                expect(commentsResource.prop('customProp2')).toEqual('value4');

                resolve();
            }, 100);
        });
    });
});
