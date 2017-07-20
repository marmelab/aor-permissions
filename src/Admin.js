import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import { Admin as OriginalAdmin, Resource } from 'admin-on-rest';
import AuthProvider from './AuthProvider';
import { AUTH_GET_PERMISSIONS } from './constants';

export const applyPermissionsToResource = async (authClient, resource) => {
    if (resource.props.permission && !await authClient(AUTH_GET_PERMISSIONS, resource.props.permission)) {
        return false;
    }

    const newResource = {
        name: resource.props.name,
        icon: resource.props.icon,
        options: resource.props.options,
        checkCredentials: resource.props.checkCredentials,
        list: !resource.props.listPermission || (await authClient(AUTH_GET_PERMISSIONS, resource.props.listPermission))
            ? resource.props.list
            : null,
        create: !resource.props.createPermission ||
            (await authClient(AUTH_GET_PERMISSIONS, resource.props.createPermission))
            ? resource.props.create
            : null,
        edit: !resource.props.editPermission || (await authClient(AUTH_GET_PERMISSIONS, resource.props.editPermission))
            ? resource.props.edit
            : null,
        show: !resource.props.showPermission || (await authClient(AUTH_GET_PERMISSIONS, resource.props.showPermission))
            ? resource.props.show
            : null,
        remove: !resource.props.removePermission ||
            (await authClient(AUTH_GET_PERMISSIONS, resource.props.removePermission))
            ? resource.props.remove
            : null,
    };

    return newResource;
};

export const applyPermissionsToResources = async (authClient, resources) => {
    const newResources = await Promise.all(
        Children.map(resources, resource => applyPermissionsToResource(authClient, resource)),
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
        applyPermissionsToResources(this.props.authClient, this.props.children).then(resources =>
            this.setState({ resources }),
        );
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
