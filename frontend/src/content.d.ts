declare module "@content/categories.json" {
  const data: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  export default data;
}

declare module "@content/scenarios.json" {
  const data: Array<{
    id: string;
    category_id: string;
    char_name: string;
    char_role: string;
    char_avatar: string;
    situation: string;
    dialogue: string;
    reference: string;
    is_violation: boolean;
    explanation: string;
    status: string;
  }>;
  export default data;
}
