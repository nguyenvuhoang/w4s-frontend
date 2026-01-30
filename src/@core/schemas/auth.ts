import { getDictionary } from '@utils/getDictionary';
import { nonEmpty, object, pipe, string } from 'valibot';

export const createLoginSchema = (dictionary: Awaited<ReturnType<typeof getDictionary>>) => {

  return object({
    username: pipe(
      string(),
      nonEmpty(dictionary['auth'].usernamerequired)
    ),
    password: pipe(
      string(),
      nonEmpty(dictionary['auth'].passwordrequired)
    ),
  });
};

