import expect, { createSpy } from 'expect';
import resolvePermissions from './resolvePermissions';

describe('resolvePermissions', () => {
    const checker = createSpy().andCall(params => Promise.resolve(params.permissions === 'function'));
    const parameters = {
        mappings: [
            { permissions: 'admin', view: 'SingleValue' },
            { permissions: ['ignored_role', 'array_value'], view: 'ArrayValue' },
            { permissions: ['array_value_exact_1', 'array_value_exact_2'], exact: true, view: 'ArrayValueExactMatch' },
            { permissions: checker, view: 'FunctionValue', exact: true },
        ],
        resource: 'products',
        record: { category: 'announcements' },
    };

    it('returns a match with mapping having a single value permissions and available permissions is a single value', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: 'admin',
        });

        expect(match.view).toEqual('SingleValue');
    });

    it('returns a match with mapping having an array of permissions and available permissions is a single value', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: 'array_value',
        });

        expect(match.view).toEqual('ArrayValue');
    });

    it('returns a match with mapping having an array of permissions, available permissions is an array and exact is falsy', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: ['array_value', 'foo'],
        });

        expect(match.view).toEqual('ArrayValue');
    });

    it('returns a match with mapping having an array of permissions, available permissions is a single value and exact match requested', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: ['array_value_exact_1', 'array_value_exact_2'],
        });

        expect(match.view).toEqual('ArrayValueExactMatch');
    });

    it('returns a match with mapping being a function', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: 'function',
        });

        expect(match.view).toEqual('FunctionValue');
        expect(checker).toHaveBeenCalledWith({
            permissions: 'function',
            resource: 'products',
            record: { category: 'announcements' },
            exact: true,
        });
    });

    it('returns undefined if no match found', async () => {
        const match = await resolvePermissions({
            ...parameters,
            permissions: 'an_unknown_permission',
        });

        expect(match).toNotExist();
    });
});
