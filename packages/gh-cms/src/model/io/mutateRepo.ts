
export const mutateStrRepo = (query: string) => `
  mutation {
      ${query}
  }`;

export const deleteLabel =
  (id: string) => `deleteLabel(input: {id: "${id}"}) { clientMutationId }`;
