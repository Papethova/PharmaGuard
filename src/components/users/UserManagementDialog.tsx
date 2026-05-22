import { useState } from "react";
import { UserPlus, UserMinus, Edit, Trash2, PlusCircle, RefreshCcw, Users } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../../lib/errorHandlers";

interface UserManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  users: {id: string, name: string, title?: string}[];
  isSubmitting: boolean;
  setIsSubmitting: (sub: boolean) => void;
}

export function UserManagementDialog({
  isOpen,
  onOpenChange,
  userEmail,
  users,
  isSubmitting,
  setIsSubmitting
}: UserManagementDialogProps) {
  const [userName, setUserName] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [editingUser, setEditingUser] = useState<{id: string, name: string, title?: string} | null>(null);

  const handleAddUser = async () => {
    if (!userName || !userEmail) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "users", userEmail.toLowerCase(), "staff"), {
        name: userName,
        title: userTitle
      });
      setUserName("");
      setUserTitle("");
      toast.success("Authorized user added to terminal");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userEmail}/staff`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !userEmail) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", userEmail.toLowerCase(), "staff", editingUser.id), {
        name: editingUser.name,
        title: editingUser.title
      });
      setEditingUser(null);
      toast.success("User credentials updated");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userEmail}/staff/${editingUser.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!userEmail) return;
    try {
      await deleteDoc(doc(db, "users", userEmail.toLowerCase(), "staff", id));
      toast.success("User access revoked from terminal");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userEmail}/staff/${id}`);
    }
  };

  const tableHeadClass = "text-[10px] uppercase font-black text-brand-blue/60 tracking-widest text-center h-10";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-brand-blue/10 p-0 overflow-hidden rounded-2xl flex flex-col h-[600px] max-h-[85vh] touch-none">
        <DialogHeader className="p-6 pb-4 bg-brand-blue text-white relative shrink-0 touch-auto">
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden border border-brand-yellow/20">
              <Users className="h-5 w-5 text-brand-blue" />
            </div>
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Personnel Registry
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] tracking-widest mt-1 uppercase">
                Terminal Authority Management
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 shrink-0 border-b border-brand-blue/5 touch-auto">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-brand-dark-grey uppercase tracking-widest">Enroll New Authorized User</Label>
            <div className="flex gap-2 items-center">
              <Input 
                placeholder="Full Name..." 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-brand-surface border-brand-grey/20 focus-visible:ring-brand-blue h-8 flex-1 text-sm"
              />
              <Select value={userTitle} onValueChange={setUserTitle}>
                <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-8 flex items-center w-28 text-xs font-normal ${!userTitle ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                  <SelectValue placeholder="Title...." />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-blue/10">
                  <SelectItem value="PIC">PIC</SelectItem>
                  <SelectItem value="RPh">RPh</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddUser} 
                className="bg-brand-blue text-white hover:brightness-110 h-8 px-4 font-black shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col touch-auto">
          <div className="px-6 pt-3 pb-1 shrink-0">
            <Label className="text-[10px] font-black text-brand-dark-grey uppercase tracking-widest">Authorized Registry Personnel</Label>
          </div>
          <div className="flex-1 min-h-0 px-6 pb-6 mt-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 h-full border border-brand-grey/20 rounded-lg bg-brand-surface shadow-inner relative touch-auto overflow-hidden">
              <Table className="relative border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-40 bg-brand-light-grey">
                  <TableRow className="bg-brand-light-grey hover:bg-transparent">
                    <TableHead className={`${tableHeadClass} bg-brand-light-grey border-b border-brand-blue/10 sticky top-0 z-40 h-8 text-xs`}>Name & Title</TableHead>
                    <TableHead className={`${tableHeadClass} text-center bg-brand-light-grey border-b border-brand-blue/10 sticky top-0 z-40 h-8 text-xs`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-[10px] text-brand-grey/40 uppercase font-bold">No registered users</TableCell>
                    </TableRow>
                  ) : users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-brand-blue/5 h-10">
                      <TableCell className="font-medium text-brand-dark-grey py-2 text-center text-xs">
                        {editingUser?.id === u.id ? (
                          <div className="flex gap-1 items-center px-1">
                            <Input 
                              value={editingUser?.name || ""}
                              onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                              className="h-6 text-xs bg-brand-surface border-brand-blue/30 flex-1"
                              autoFocus
                            />
                            <Select 
                              value={editingUser?.title || ""} 
                              onValueChange={(v) => setEditingUser(prev => prev ? {...prev, title: v} : null)}
                            >
                              <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-6 flex items-center w-20 text-[10px] font-normal ${!editingUser?.title ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent className="bg-brand-surface border-brand-blue/10">
                                <SelectItem value="PIC">PIC</SelectItem>
                                <SelectItem value="RPh">RPh</SelectItem>
                                <SelectItem value="Tech">Tech</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <span>{u.name} {u.title && `(${u.title})`}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex justify-center gap-1">
                          {editingUser?.id === u.id ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-brand-blue"
                              onClick={handleUpdateUser}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-brand-dark-grey hover:text-brand-blue"
                              onClick={() => setEditingUser(u)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 text-brand-dark-grey hover:text-red-500"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 touch-auto shadow-inner">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Close User Controls
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
