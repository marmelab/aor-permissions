import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import { Admin as OriginalAdmin, Resource } from 'admin-on-rest';
import AuthProvider from './AuthProvider';
import { AUTH_GET_PERMISSIONS } from './constants';
import { resolvePermission as defaultResolvePermission } from './resolvePermissions';

export const defaultApplyPermissionsToAction = async ({
    permissions,
    resource,
    action,
    resolvePermission = defaultResolvePermission,
}) => {
    if (resource.props[`${action}Permissions`]) {
        const match = await resolvePermission({ permissions, resource })({
            exact: resource.props[`${action}Exact`],
            permissions: resource.props[`${action}Permissions`],
            resolve: resource.props[`${action}Resolve`],
            view: true,
        });

        return match.matched ? resource.props[action] : null;
    }

    return resource.props[action];
};

export const defaultApplyPermissionsToResource = async ({
    authClient,
    resource,
    resolvePermission = defaultResolvePermission,
    applyPermissionsToAction = defaultApplyPermissionsToAction,
}) => {
    const permissions = await authClient(AUTH_GET_PERMISSIONS, { resource });

    if (resource.props.permissions) {
        const match = await resolvePermission({ permissions, resource })({
            exact: resource.props.exact,
            permissions: resource.props.permissions,
            resolve: resource.props.resolve,
            view: true,
        });

        if (!match.matched) {
            return false;
        }
    }

    const newResource = {
        name: resource.props.name,
        icon: resource.props.icon,
        options: resource.props.options,
        checkCredentials: resource.props.checkCredentials,
        list: await applyPermissionsToAction({ permissions, resource, action: 'list' }),
        create: await applyPermissionsToAction({ permissions, resource, action: 'create' }),
        edit: await applyPermissionsToAction({ permissions, resource, action: 'edit' }),
        show: await applyPermissionsToAction({ permissions, resource, action: 'show' }),
        remove: await applyPermissionsToAction({ permissions, resource, action: 'remove' }),
    };

    return newResource;
};

export const applyPermissionsToResources = async ({
    authClient,
    resources,
    applyPermissionsToResource = defaultApplyPermissionsToResource,
}) => {
    const newResources = await Promise.all(
        Children.map(resources, resource => applyPermissionsToResource({ authClient, resource })),
    );

    return newResources.filter(resource => !!resource);
};

export default class Admin extends Component {
    static propTypes = {
        authClient: PropTypes.func.isRequired,
        children: PropTypes.node.isRequired,
    };

    state = { resources: false };

    componentWillMount() {
        applyPermissionsToResources({ authClient: this.props.authClient, resources: this.props.children })
            .then(resources => this.setState({ resources }))
            .catch(error => console.error(error));
    }

    render() {
        const { authClient, ...props } = this.props;
        const { resources } = this.state;

        if (!resources) return null;

        return (
            <AuthProvider authClient={authClient}>
                <OriginalAdmin {...props}>
                    {resources.map(resource => <Resource key={resource.name} {...resource} />)}
                </OriginalAdmin>
            </AuthProvider>
        );
    }
}
