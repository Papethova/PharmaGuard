import { useState } from "react";
import { UserPlus, UserMinus, Edit, Trash2, PlusCircle, RefreshCcw, Users, Camera } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../../lib/errorHandlers";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { UserProfile } from "../../types";

interface UserManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userProfile: UserProfile | null;
  users: {id: string, name: string, title?: string}[];
  isSubmitting: boolean;
  setIsSubmitting: (sub: boolean) => void;
}

export function UserManagementDialog({
  isOpen,
  onOpenChange,
  userEmail,
  userProfile,
  users,
  isSubmitting,
  setIsSubmitting
}: UserManagementDialogProps) {
  const [userName, setUserName] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [editingUser, setEditingUser] = useState<{id: string, name: string, title?: string} | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleTogglePhoto = async (enabled: boolean) => {
    if (!userEmail) return;
    try {
      await updateDoc(doc(db, "users", userEmail.toLowerCase()), {
        isPhotoRequirementEnabled: enabled
      });
      toast.success(`Photo verification ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error("Security policy update failed");
    }
  };

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
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userEmail || !userToDelete) return;
    try {
      await deleteDoc(doc(db, "users", userEmail.toLowerCase(), "staff", userToDelete));
      toast.success("User access revoked from terminal");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userEmail}/staff/${userToDelete}`);
    } finally {
      setUserToDelete(null);
    }
  };

  const tableHeadClass = "text-[10px] font-black text-brand-blue tracking-widest text-center h-10";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <Users className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">User Management</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">Add, edit, or remove authorized users for this system</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            <div className="bg-brand-blue/5 border border-brand-blue/10 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${userProfile?.isPhotoRequirementEnabled ? 'bg-brand-yellow shadow-[0_0_15px_rgba(255,230,0,0.4)]' : 'bg-brand-blue/10'}`}>
                  <Camera className={`h-6 w-6 transition-colors duration-300 ${userProfile?.isPhotoRequirementEnabled ? 'text-brand-blue' : 'text-brand-blue/60'}`} />
                </div>
                <div className="space-y-0.5">
                  <Label className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${userProfile?.isPhotoRequirementEnabled ? 'text-brand-blue' : 'text-brand-blue/40'}`}>
                    Photo Verification
                  </Label>
                  <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${userProfile?.isPhotoRequirementEnabled ? 'text-brand-blue/80' : 'text-brand-blue/40'}`}>
                    Capture photos for each transaction
                  </p>
                </div>
              </div>
              <Switch 
                checked={userProfile?.isPhotoRequirementEnabled || false}
                onCheckedChange={handleTogglePhoto}
                className="data-[state=checked]:bg-brand-blue data-[state=unchecked]:bg-brand-blue/20 shadow-[0_0_10px_rgba(30,104,207,0.3)]Scale-x-110"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-black font-bold text-[10px] tracking-wider uppercase pl-1">Add Authorized Personnel</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-brand-surface border-brand-blue/20 text-sm h-8 flex-1 text-black placeholder:text-brand-grey/50"
                />
                <Select value={userTitle} onValueChange={setUserTitle}>
                  <SelectTrigger className="w-32 h-8 bg-brand-surface border-brand-blue/20 text-xs text-brand-blue px-3 text-left justify-start font-bold">
                    <SelectValue placeholder="Title..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface" align="start">
                    <SelectItem value="PIC" className="text-black">PIC</SelectItem>
                    <SelectItem value="RPh" className="text-black">RPh</SelectItem>
                    <SelectItem value="Tech" className="text-black">Tech</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddUser} 
                  className="bg-[#FFE600] text-brand-blue hover:brightness-110 active:scale-[0.9] h-8 px-4 border-none shadow-lg shadow-yellow-400/30 font-bold transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-black font-bold text-[10px] tracking-wider uppercase pl-1">System Users</Label>
              <div className="border border-brand-grey/20 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-brand-light-grey/50">
                    <TableRow>
                      <TableHead className={`${tableHeadClass} text-left pl-6`}>Name</TableHead>
                      <TableHead className={`${tableHeadClass} text-center`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-brand-blue/5">
                        <TableCell className="text-black py-3 text-left pl-6 text-sm">
                          {editingUser?.id === u.id ? (
                            <div className="flex gap-2 items-center">
                              <Input 
                                value={editingUser?.name || ""}
                                onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                                className="h-8 bg-brand-surface border-brand-blue/30 flex-1 text-black placeholder:text-brand-grey/30"
                                autoFocus
                              />
                              <Select 
                                value={editingUser?.title || ""} 
                                onValueChange={(v) => setEditingUser(prev => prev ? {...prev, title: v} : null)}
                              >
                                <SelectTrigger className="w-28 h-8 bg-brand-surface border-brand-blue/30 text-black">
                                  <SelectValue placeholder="Title" />
                                </SelectTrigger>
                                <SelectContent className="bg-brand-surface">
                                  <SelectItem value="PIC" className="text-black">PIC</SelectItem>
                                  <SelectItem value="RPh" className="text-black">RPh</SelectItem>
                                  <SelectItem value="Tech" className="text-black">Tech</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="flex items-center justify-start gap-2">
                              <span className="text-black text-sm">{u.name}</span>
                              {u.title && <span className="text-black text-sm uppercase tracking-tight">({u.title})</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex justify-center gap-1">
                            {editingUser?.id === u.id ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-brand-blue"
                                onClick={handleUpdateUser}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-brand-dark-grey/60 hover:text-brand-blue"
                                onClick={() => setEditingUser(u)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-brand-dark-grey/60 hover:text-brand-blue"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-brand-yellow/30"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog 
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove User"
        subtitle="Credential Revocation"
        description={
          <div className="space-y-4">
            <p>
              Are you sure you want to remove <span className="text-black font-bold">{users.find(u => u.id === userToDelete)?.name || "this user"}</span>'s authorization? They will no longer be able to sign transactions in this terminal.
            </p>
            <p>
              This action cannot be undone and will immediately disable their login credentials for this node.
            </p>
          </div>
        }
        onConfirm={confirmDelete}
        confirmLabel="Confirm Removal"
        cancelLabel="Keep User"
        icon={<Trash2 className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
      />
    </Dialog>
  );
}
