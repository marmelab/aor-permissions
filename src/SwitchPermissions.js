import React, { createElement, Component } from 'react';
import PropTypes from 'proptypes';
import FormField from 'admin-on-rest/lib/mui/form/FormField';
import getContext from 'recompose/getContext';

import DefaultLoading from './Loading';
import { AUTH_GET_PERMISSIONS } from './constants';
import resolvePermissions from './resolvePermissions';

export class SwitchPermissionsComponent extends Component {
    static propTypes = {
        authClient: PropTypes.func,
        authClientFromContext: PropTypes.func,
        children: PropTypes.node.isRequired,
        notFound: PropTypes.func,
        loading: PropTypes.func,
        record: PropTypes.object,
        resource: PropTypes.string,
    };

    static defaultProps = {
        notFound: null,
        loading: DefaultLoading,
    };

    state = {
        isNotFound: false,
        match: undefined,
        role: undefined,
    };

    async componentWillMount() {
        const { authClient, authClientFromContext, children, record, resource } = this.props;
        const mappings = React.Children.map(children, ({ props: { value, resolve, children, exact } }) => ({
            permissions: value,
            resolve,
            view: children,
            exact,
        })) || [];

        const finalAuthClient = authClient || authClientFromContext;

        const permissions = await finalAuthClient(AUTH_GET_PERMISSIONS, { record, resource });
        const match = await resolvePermissions({ mappings, permissions, record, resource });

        if (match) {
            this.setState({ match: match.view });
        } else {
            this.setState({ isNotFound: true, permissions });
        }
    }

    render() {
        const { isNotFound, match, role } = this.state;
        const { authClient, authClientFromContext, children, notFound, loading, ...props } = this.props;

        if (isNotFound) {
            if (notFound) {
                return createElement(notFound, { role });
            }
            return null;
        }

        if (!match) {
            return createElement(loading);
        }

        return <span>{React.Children.map(match, child => <FormField input={child} {...props} />)}</span>;
    }
}

export default getContext({
    authClientFromContext: PropTypes.func,
})(SwitchPermissionsComponent);
