export default ({ mappings, permissions, record, resource }) =>
    Promise.all(
        mappings.map(mapping => {
            if (typeof mapping.permissions === 'function') {
                const result = mapping.permissions({ record, resource, permissions, exact: mapping.exact });

                if (typeof result.then === 'function') {
                    return result.then(matched => ({ matched, view: mapping.view }));
                }

                return Promise.resolve({ matched: result, view: mapping.view });
            }

            if (Array.isArray(mapping.permissions) && Array.isArray(permissions)) {
                if (mapping.exact) {
                    return Promise.resolve({
                        matched: mapping.permissions.every(mp => permissions.includes(mp)),
                        view: mapping.view,
                    });
                }

                return Promise.resolve({
                    matched: mapping.permissions.some(mp => permissions.includes(mp)),
                    view: mapping.view,
                });
            }

            if (Array.isArray(mapping.permissions)) {
                return Promise.resolve({
                    matched: mapping.permissions.includes(permissions),
                    view: mapping.view,
                });
            }

            if (Array.isArray(permissions)) {
                return Promise.resolve({
                    matched: permissions.includes(mapping.permissions),
                    view: mapping.view,
                });
            }

            return Promise.resolve({ matched: mapping.permissions === permissions, view: mapping.view });
        }),
    ).then(matchers => matchers.find(match => match.matched));
