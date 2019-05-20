export function sanitizeName(name: string): string {
    return name.replace(/[-.]/g, '_');
}
