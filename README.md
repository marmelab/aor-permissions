<table>
        <tr>
            <td><img width="20" src="https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/archive.svg" alt="archived" /></td>
            <td><strong>Archived Repository</strong><br />
            This code is no longer maintained. Feel free to fork it, but use it at your own risks.
        </td>
        </tr>
</table>

# aor-permissions

**This project is discontinued. Its features have been merged in admin-on-rest 1.3.0. See [admin-on-rest documentation](https://marmelab.com/admin-on-rest/Authorization.html)**

[![Build Status](https://travis-ci.org/marmelab/aor-permissions.svg?branch=master)](https://travis-ci.org/marmelab/aor-permissions)

A component for [Admin-on-rest](https://github.com/marmelab/admin-on-rest) allowing to switch views depending on user roles.

- [Installation](#installation)
- [Usage](#installation)
- [API](#api)
    - [SwitchPermissions](#switchpermissions)
    - [Permission](#permission)
    - [WithPermission](#withpermission)
    - [AuthProvider](#authprovider)

## Installation

Install with:

```sh
npm install --save aor-permissions
```

or

```sh
yarn add aor-permissions
```

## Usage

First, the [authClient](https://marmelab.com/admin-on-rest/Authentication.html) must handle a new type: `AUTH_GET_PERMISSIONS`.

Here is a naive implementation using localstorage:

```jsx
// in authClient.js
import { AUTH_LOGIN, AUTH_LOGOUT, AUTH_CHECK, AUTH_ERROR } from 'admin-on-rest';
import { AUTH_GET_PERMISSIONS } from 'aor-permissions';
import { decode } from 'jsonwebtoken';

export default (type, params) => {
    if (type === AUTH_LOGIN) {
        const { username, password } = params;
        const request = new Request('https://mydomain.com/authenticate', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        return fetch(request)
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(({ token, permissions }) => {
                const decoded = decode(token);
                localStorage.setItem('token', token);
                localStorage.setItem('permissions', decoded.permissions);
            });
    }
    // ... usual authClient code

    if (type === AUTH_GET_PERMISSIONS) {
        return Promise.resolve(localStorage.getItem('permissions'));
    }
};
```

Then, you may use the `SwitchPermissions` and `Permission` components:

### Simple permissions check

```jsx
// In products.js
import { SwitchPermissions, Permission } from 'aor-permissions';
import authClient from '../authClient';

// ...other views as usual (List, Create, etc.)

// Use this ProductEdit component as usual in your resource declaration
export const ProductEdit = props => (
    <SwitchPermissions authClient={authClient} {...props}>
        <Permission value="role1">
            <Edit {...props}>
                {/* Usual layout component */}
            </Edit>
        </Permission>
        <Permission value={['role2', 'role3']}>
            <Edit {...props}>
                {/* Usual layout component */}
            </Edit>
        </Permission>
        <Permission value={['role2', 'role3']} exact>
            <Edit {...props}>
                {/* Usual layout component */}
            </Edit>
        </Permission>
    </SwitchPermissions>
);
```

### Permissions check depending on the resource/record

```jsx
// In products.js
import { SwitchPermissions, Permission } from 'aor-permissions';
import authClient from '../authClient';

// ...other views as usual (List, Create, etc.)

const checkUserCanEdit = (params) => {
    const user = params.permissions; // This is the result of the `authClient` call with type `AUTH_GET_PERMISSIONS`
    const resource = params.resource; // The resource, eg: 'posts'
    const record = params.record; // The current record (only supplied for Edit)

    // Only user with admin role can edit the posts of the 'announcements' category
    if (record.category === 'announcement' && user.role === 'admin') {
        return true;
    }

    return false;
}

// Use this PostEdit component as usual in your resource declaration
// Note that in order to get the record, we must have the SwitchPermissions component inside the Edit component
export const PostEdit = props => (
    <Edit {...props}>
        <SwitchPermissions authClient={authClient} {...props}>
            <Permission resolve={checkUserCanEdit}>
                {/* Usual layout component */}
            </Permission>
            <Permission resolve={checkUserCanEdit}>
                {/* Usual layout component */}
            </Permission>
        </SwitchPermissions>
    </Edit>
);
```

### Protect access to resources

```jsx
import { Admin } from 'aor-permissions';
import { Resource } from 'admin-on-rest';
import restClient from '../restClient';
import authClient from '../authClient';
import { PostList, PostEdit, PostCreate } from './posts';

const resolveAccessToPosts = ({ resource, permissions, exact, value }) => {
    // value = the requested permissions specified in the `permissions` prop (eg `admin`). May be undefined
    // resource = the requested resource (eg `posts`)
    // exact = the value of the `exact` prop
    // permissions = the result of the authClient call
};

const resolveEditAccess = ({ resource, permissions, exact, value }) => {
    // value = the requested permissions specified in the `permissions` prop (eg `admin`). May be undefined
    // resource = the requested resource (eg `posts`)
    // exact = the value of the `exact` prop
    // permissions = the result of the authClient call
};

const App = () => (
    <Admin restClient={restClient} authClient={authClient}>
        <Resource
            name="posts"
            resolve={resolveAccessToPosts}
            list={PostList}
            edit={PostEdit}
            editPermissions="admin"
            editResolve={resolveEditAccess}
            create={PostCreate}
            createPermissions="admin"
            createExact={true}
        />
    </Admin>
);

```

## API

### SwitchPermissions

The `SwitchPermissions` component requires an `authClient` prop which accepts the same ([authClient](https://marmelab.com/admin-on-rest/Authentication.html)) as in Admin-on-rest. However, this client must be able to handle the new `AUTH_GET_PERMISSIONS` type.

It also accepts two optional props:

- `loading`: A component to display while checking for permissions. It defaults to the Material-UI [LinearProgress](http://www.material-ui.com/#/components/linear-progress) in `indeterminate` mode.
- `notFound`: A component to display when no match was found while checking the permissions. Default to `null`.

The `SwitchPermissions` component only accepts `Permission` components as children. They are used to map a permission to a view.

### Permission

The `Permission` component requires either a `value` with the permissions to check (could be a role, an array of rules, etc) or a `resolve` function.

If both are specified, only `resolve` will be used.

You can pass anything as children for this component: a view ([List](https://marmelab.com/admin-on-rest/List.html), [Create](https://marmelab.com/admin-on-rest/CreateEdit.html), [Edit](https://marmelab.com/admin-on-rest/CreateEdit.html)), an input, a React node, whatever.

#### Using the value prop

Permissions matches differently depending on the `value` type and the authClient result type.

An additional `exact` prop may be specified on the `Permission` component depending on your requirements.

The following table shows how permissions are resolved:

| permissions   | authClient result | exact   | resolve                                                                |
| ------------- | ----------------- | ------- | ---------------------------------------------------------------------- |
| single value  | single value      |         | permissions must equal authClient result                               |
| single value  | array             |         | authClient result must contain permissions                             |
| array         | single value      |         | permissions must contain authClient result                             |
| array         | array             | `false` | at least one value of permissions must be present in authClient result |
| array         | array             | `true`  | all values in permissions must be present in authClient result         |

#### Using the resolve prop

The function specified for `resolve` may return `true` or `false` directly or a promise resolving to either `true` or `false`. It will be called with an object having the following properties:

- `permissions`: the result of the `authClient` call.
- `resource`: the resource being checked (eg: `products`, `posts`, etc.)
- `value`: the value of the `value` prop
- `exact`: the value of the `exact` prop
- `record`: Only when inside an `Edit` component, the record being edited

If multiple matches are found, the first one will be applied.

### WithPermission

A simpler component which will render its children only if its permissions are matched. For example, in a custom [Menu](https://marmelab.com/admin-on-rest/AdminResource.html#menu):

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import MenuItem from 'material-ui/MenuItem';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import { WithPermission } from 'aor-permissions';
import authClient from './authClient';

const Menu = ({ onMenuTap, logout }) => (
    <div>
        {/* Other menu items */}

        <WithPermission authClient={authClient} value="admin">
            <MenuItem
                containerElement={<Link to="/configuration" />}
                primaryText="Configuration"
                leftIcon={<SettingsIcon />}
                onTouchTap={onMenuTap}
            />
        </WithPermission>
        {logout}
    </div>
);

export default Menu;
```

The `WithPermission` component accepts the following props:

- `authClient`: the same ([authClient](https://marmelab.com/admin-on-rest/Authentication.html)) as in Admin-on-rest. However, this client must be able to handle the new `AUTH_GET_PERMISSIONS` type.
- `value`: the permissions to check (could be a role, an array of rules, etc)
- `resolve`: a function called to resolve the permissions. (same as `Permission`)

You can pass anything as children for this component: a view ([List](https://marmelab.com/admin-on-rest/List.html), [Create](https://marmelab.com/admin-on-rest/CreateEdit.html), [Edit](https://marmelab.com/admin-on-rest/CreateEdit.html)), an input, a React node, whatever.

### AuthProvider

Requiring and specifying the `authClient` for each `SwitchPermissions` and `WithPermission` components could be cumbersome. That's why we also provided an `AuthProvider` component.

It must enclose the [Admin](https://marmelab.com/admin-on-rest/AdminResource.html#the-admin-component) component.

It accepts a single prop: `authClient`.

```jsx
import { Admin, Resource } from 'admin-on-rest';
import { AuthProvider } from 'aor-permissions';
import authClient from './authClient';

export const App = () => (
    <AuthProvider authClient={authClient}>
        <Admin>
            {/* Usual Resource components */}
        </Admin>
    </AuthProvider>
)
```

### Admin

This component can be used instead of the default `Admin` component from `admin-on-rest`.

It allows to define permissions on each resource and for each resource's view.

It accepts the following props:

- `permissions`: to define the permissions required for the whole resource
- `resolve`: function called to check whether permissions for the whole resource are ok
- `exact`: Boolean for exact match (useful when `permissions` is an array)

If defined, the `resolve` function will be called with an object containing the following properties:

- `permissions`: the result of the `authClient` call.
- `value`: the value of the `permissions` prop: the requested permissions
- `exact`: the value of the `exact` prop

Additionnaly, the `Admin` components accepts for each view (list, create, edit and remove) the same three props prefixed with the view's name. For example: `listPermissions`, `listResolve` and `listExact`.

**Note**: when using this custom `Admin` component, there's no need to use the `AuthProvider` too as it will be added automatically.

## Contributing

Run the tests with this command:

```sh
make test
```

Coverage data is available in `./coverage` after executing `make test`.

An HTML report is generated in `./coverage/lcov-report/index.html`.
