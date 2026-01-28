import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, FileText, Package } from "lucide-react";

interface DeliveryInfoSectionProps {
    isEditing: boolean;
    actualDeliveryDate: string;
    setActualDeliveryDate: (date: string) => void;
    deliveryUrl: string;
    setDeliveryUrl: (url: string) => void;
    deliveryNote: string;
    setDeliveryNote: (note: string) => void;
    handleInitialSave: (setDeliveredStatus: boolean) => void;
    handleTerminateSave: () => void;
    canCompleteDelivery: boolean;
    isSaving: boolean;
}

export function DeliveryInfoSection({
    isEditing,
    actualDeliveryDate,
    setActualDeliveryDate,
    deliveryUrl,
    setDeliveryUrl,
    deliveryNote,
    setDeliveryNote,
    handleInitialSave,
    handleTerminateSave,
    canCompleteDelivery,
    isSaving
}: DeliveryInfoSectionProps) {
    if (!isEditing) return null;

    return (
        <Card className="border-l-4 border-l-amber-500 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800">Step 2: 納品情報</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><Calendar className="w-4 h-4" /> 納品完了日</Label>
                        <Input type="date" value={actualDeliveryDate} onChange={(e) => setActualDeliveryDate(e.target.value)} className={`h-10 bg-white ${!actualDeliveryDate ? 'border-amber-400' : 'border-green-400'}`} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><FileText className="w-4 h-4" /> 納品URL</Label>
                        <Input type="text" placeholder="https://drive.google.com/..." value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className={`h-10 bg-white text-sm ${!deliveryUrl ? 'border-amber-400' : 'border-green-400'}`} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><FileText className="w-4 h-4" /> 納品備考</Label>
                        <Textarea
                            placeholder="納品に関する申し送り事項などがあれば記載してください"
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            className="bg-white min-h-[80px]"
                        />
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        onClick={() => handleInitialSave(true)}
                        disabled={!canCompleteDelivery || isSaving}
                        className={`px-12 h-14 text-lg font-bold shadow-xl ${canCompleteDelivery ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
                    >
                        <CheckCircle2 className="mr-2 h-6 w-6" /> 納品完了
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => {
                            handleTerminateSave();
                        }}
                        disabled={!canCompleteDelivery || isSaving}
                        variant="outline"
                        className={`ml-4 h-14 border-amber-500 text-amber-600 hover:bg-amber-50 ${canCompleteDelivery ? '' : 'opacity-50 cursor-not-allowed'}`}
                    >
                        ⚠️ 途中終了
                    </Button>
                </div>
                {!canCompleteDelivery && <p className="text-center text-sm text-amber-600">⚠️ 納品完了には、全タスクの納期・納品URLの入力が必要です</p>}
            </CardContent>
        </Card>
    );
}
