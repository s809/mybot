import { connect } from 'mongoose';
import { scriptListDefaults } from './defaults';
import { ScriptList } from './models';

export const database = await connect("mongodb://127.0.0.1:27017/mybot");

for (const name of ["startup", "callable"]) {
    if (!await ScriptList.findById(name))
        await ScriptList.create(scriptListDefaults(name))
}
