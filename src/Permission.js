import React from 'react';
import PropTypes from 'prop-types';

const Permission = () => <span>&lt;ForRole&gt; elements are for configuration only and should not be rendered</span>;

Permission.propTypes = {
    children: PropTypes.node.isRequired,
    exact: PropTypes.bool,
    permissions: PropTypes.any.isRequired,
};

export default Permission;
