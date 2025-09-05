//create a function to format date
export function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}