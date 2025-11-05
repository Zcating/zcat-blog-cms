import { View } from "@blog/components";

export function BlogContent({ children }: { children: React.ReactNode }) {
  return (
    <View className="min-h-[calc(100vh-80px)] pb-3 mt-4 relative">
      {children}
    </View>
  );
}
