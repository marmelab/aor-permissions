import React, { createElement, Component } from 'react';
import PropTypes from 'proptypes';
import FormField from 'admin-on-rest/lib/mui/form/FormField';
import getContext from 'recompose/getContext';

import DefaultLoading from './Loading';
import { AUTH_GET_PERMISSIONS } from './constants';
import { resolvePermission } from './resolvePermissions';

export class WithPermissionComponent extends Component {
    static propTypes = {
        authClient: PropTypes.func,
        authClientFromContext: PropTypes.func,
        children: PropTypes.node.isRequired,
        loading: PropTypes.func,
        notFound: PropTypes.func,
        record: PropTypes.object,
        resource: PropTypes.string,
        value: PropTypes.any,
        resolve: PropTypes.func,
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
        const {
            authClient,
            authClientFromContext,
            children,
            record,
            resolve,
            resource,
            value: requiredPermissions,
            exact,
        } = this.props;
        const finalAuthClient = authClient || authClientFromContext;

        const permissions = await finalAuthClient(AUTH_GET_PERMISSIONS, { record, resource });
        const match = await resolvePermission({ permissions, record, resource })({
            exact,
            permissions: requiredPermissions,
            resolve,
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

        if (Array.isArray(children)) {
            return (
                <div>
                    {React.Children.map(children, child => (
                        <div
                            key={child.props.source}
                            style={child.props.style}
                            className={`aor-input-${child.props.source}`}
                        >
                            <FormField input={child} {...props} />
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div
                key={children.props.source}
                style={children.props.style}
                className={`aor-input-${children.props.source}`}
            >
                <FormField input={children} {...props} />
            </div>
        );
    }
}

export default getContext({
    authClientFromContext: PropTypes.func,
})(WithPermissionComponent);
