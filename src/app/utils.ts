import { option, taskEither as T } from "fp-ts"
import { Option } from "fp-ts/lib/Option"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { AppError } from "./errors"

export function orElseFailWith<VALUE>(onNone: AppError): (option: Option<VALUE>) => TaskEither<AppError, VALUE> {
    return option.fold(() => T.left<AppError, VALUE>(onNone), (value: VALUE) => T.right<AppError, VALUE>(value))
}
