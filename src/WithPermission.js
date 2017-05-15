import React, { createElement, Component } from 'react';
import PropTypes from 'proptypes';
import FormField from 'admin-on-rest/lib/mui/form/FormField';
import getContext from 'recompose/getContext';

import DefaultLoading from './Loading';
import { AUTH_GET_PERMISSIONS } from './constants';
import { resolvePermission } from './resolvePermissions';

export class WithPermissionComponent extends Component {
    static propTypes = {
        authClient: PropTypes.func.isRequired,
        children: PropTypes.node.isRequired,
        loading: PropTypes.func,
        notFound: PropTypes.func,
        record: PropTypes.object,
        resource: PropTypes.string,
        value: PropTypes.any.isRequired,
    };

    static defaultProps = {
        loading: DefaultLoading,
    };

    state = {
        isNotFound: false,
        match: undefined,
        role: undefined,
    };

    async componentWillMount() {
        const { authClient, children, record, resource, value: requiredPersmissions, exact } = this.props;
        const permissions = await authClient(AUTH_GET_PERMISSIONS, { record, resource });
        const match = await resolvePermission({ permissions, record, resource })({
            exact,
            permissions: requiredPersmissions,
            view: children,
        });

        if (match && match.matched) {
            this.setState({ match: match.view });
        } else {
            this.setState({ isNotFound: true, permissions });
        }
    }

    render() {
        const { isNotFound, match, role } = this.state;
        const { authClient, children, notFound, loading, ...props } = this.props;

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
    authClient: PropTypes.func,
})(WithPermissionComponent);
