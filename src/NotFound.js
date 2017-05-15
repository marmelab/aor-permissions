import React from 'react';
import PropTypes from 'proptypes';
import { translate } from 'admin-on-rest';
import { Card, CardText } from 'material-ui/Card';

const NotFoundComponent = ({ translate }) => (
    <Card>
        <CardText>
            {translate('aor-permissions.forbidden')}
        </CardText>
    </Card>
);

NotFoundComponent.propTypes = {
    translate: PropTypes.func.isRequired,
};

export default translate(NotFoundComponent);
