import React, { createElement, cloneElement, Component } from 'react';
import PropTypes from 'proptypes';
import FormField from 'admin-on-rest/lib/mui/form/FormField';

import DefaultLoading from './Loading';
import DefaultNotFound from './NotFound';
import { AUTH_GET_PERMISSIONS } from './constants';
import resolvePermissions from './resolvePermissions';

export default class SwitchPermissions extends Component {
    static propTypes = {
        authClient: PropTypes.func.isRequired,
        children: PropTypes.node.isRequired,
        notFound: PropTypes.func,
        loading: PropTypes.func,
        record: PropTypes.object,
        resource: PropTypes.string,
    };

    static defaultProps = {
        notFound: DefaultNotFound,
        loading: DefaultLoading,
    };

    state = {
        isNotFound: false,
        match: undefined,
        role: undefined,
    };

    async componentWillMount() {
        const { authClient, children, record, resource } = this.props;
        const mappings = React.Children.map(children, ({ props: { permissions, children, exact } }) => ({
            permissions,
            view: children,
            exact,
        })) || [];

        const permissions = await authClient(AUTH_GET_PERMISSIONS, { record, resource });
        const match = await resolvePermissions({ mappings, permissions, record, resource });

        if (match) {
            this.setState({ match: match.view });
        } else {
            this.setState({ isNotFound: true, permissions });
        }
    }

    render() {
        const { isNotFound, match, role } = this.state;
        const { authClient, children, notFound, loading, ...props } = this.props;

        if (isNotFound) {
            return createElement(notFound, { role });
        }

        if (!match) {
            return createElement(loading);
        }

        return <div>{React.Children.map(match, child => <FormField input={cloneElement(child)} {...props} />)}</div>;
    }
}
