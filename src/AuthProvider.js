import { cloneElement } from 'react';
import PropTypes from 'prop-types';
import withContext from 'recompose/withContext';

const AuthProviderComponent = ({ authClient, children }) => cloneElement(children, { authClient });

AuthProviderComponent.propTypes = {
    children: PropTypes.node.isRequired,
};

export default withContext({ authClientFromContext: PropTypes.func }, ({ authClient }) => ({
    authClientFromContext: authClient,
}))(AuthProviderComponent);
