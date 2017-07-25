import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import { Admin as OriginalAdmin } from 'admin-on-rest';
import AuthProvider from './AuthProvider';
import { AUTH_GET_PERMISSIONS } from './constants';
import defaultResolvePermissions, { resolvePermission as defaultResolvePermission } from './resolvePermissions';

export const filterResourcesFromWithPermission = async ({
    authClient,
    withPermission,
    resolvePermission = defaultResolvePermission,
}) => {
    const permissions = await authClient(AUTH_GET_PERMISSIONS);
    const match = await resolvePermission({ permissions })({
        exact: withPermission.props.exact,
        permissions: withPermission.props.value,
        resolve: withPermission.props.resolve,
    });

    return match.matched ? withPermission.props.children : false;
};

export const filterResourcesFromSwitchPermissions = async ({
    authClient,
    switchPermissions,
    resolvePermissions = defaultResolvePermissions,
}) => {
    const mappings =
        Children.map(switchPermissions.props.children, ({ props: { value, resolve, children, exact } }) => ({
            permissions: value,
            resolve,
            view: Children.toArray(children),
            exact,
        })) || [];

    const permissions = await authClient(AUTH_GET_PERMISSIONS);
    const match = await resolvePermissions({ mappings, permissions });

    return match ? match.view : false;
};

export const filterResourcesFromPermissions = async ({ authClient, resources: allResources }) => {
    const resources = await Promise.all(
        Children.toArray(allResources).map(async child => {
            if (child.type.displayName === 'WithPermission') {
                return await filterResourcesFromWithPermission({ authClient, withPermission: child });
            }

            if (child.type.displayName === 'SwitchPermissions') {
                return await filterResourcesFromSwitchPermissions({ authClient, switchPermissions: child });
            }

            return [child];
        }),
    );

    return resources.filter(r => !!r).reduce((acc, r) => [...acc, ...r], []);
};

export default class Admin extends Component {
    static propTypes = {
        authClient: PropTypes.func.isRequired,
        children: PropTypes.node.isRequired,
    };

    state = { resources: false };

    componentWillMount() {
        filterResourcesFromPermissions({ authClient: this.props.authClient, resources: this.props.children })
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
                    {resources}
                </OriginalAdmin>
            </AuthProvider>
        );
    }
}
