"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProspects } from "@/hooks/use-prospects";
import type { ProductType, ProspectType, ProspectStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";

const PRODUCTS: ProductType[] = ["Mobile app", "Website/CMS", "LitteraWorks", "CMS", "Other"];
const TYPES: ProspectType[] = ["Media", "Sports Club", "Sports League", "Other"];
const COUNTRIES = ["Serbia", "Croatia", "Slovenia", "Spain", "Azerbaijan", "Ghana"];
const STATUSES: ProspectStatus[] = ["Hot", "Warm", "Cold", "Lost"];

interface AddProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProspectDialog({ open, onOpenChange }: AddProspectDialogProps) {
  const { addProspect } = useProspects();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    productType: "" as ProductType | "",
    owner: "Aleksandar",
    prospectType: "" as ProspectType | "",
    country: "",
    status: "Warm" as ProspectStatus,
    contactPerson: "",
    email: "",
    telephone: "",
    website: "",
    dealValue: "",
    nextAction: "",
    comment: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await addProspect({
        company: formData.company,
        productType: formData.productType || undefined,
        owner: formData.owner || undefined,
        prospectType: formData.prospectType || undefined,
        country: formData.country || undefined,
        status: formData.status,
        contactPerson: formData.contactPerson || undefined,
        email: formData.email || undefined,
        telephone: formData.telephone || undefined,
        website: formData.website || undefined,
        dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
        nextAction: formData.nextAction || undefined,
        lastContactDate: new Date().toISOString().split('T')[0],
        daysSinceContact: 0,
        archived: false,
      });

      // Reset form
      setFormData({
        company: "",
        productType: "",
        owner: "Aleksandar",
        prospectType: "",
        country: "",
        status: "Warm",
        contactPerson: "",
        email: "",
        telephone: "",
        website: "",
        dealValue: "",
        nextAction: "",
        comment: "",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error adding prospect:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Info</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productType">Product</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(v) => handleChange("productType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prospectType">Type</Label>
                  <Select
                    value={formData.prospectType}
                    onValueChange={(v) => handleChange("prospectType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(v) => handleChange("country", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dealValue">Deal Value (€)</Label>
                  <Input
                    id="dealValue"
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => handleChange("dealValue", e.target.value)}
                    placeholder="e.g., 45000"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => handleChange("owner", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contact Info</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                  placeholder="e.g., Ana Petrović"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => handleChange("telephone", e.target.value)}
                    placeholder="+381 11 123 4567"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Next Steps</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nextAction">Next Action</Label>
                <Input
                  id="nextAction"
                  value={formData.nextAction}
                  onChange={(e) => handleChange("nextAction", e.target.value)}
                  placeholder="e.g., Schedule demo call, Send proposal"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="comment">Initial Note</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => handleChange("comment", e.target.value)}
                  placeholder="Add initial comment or note..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Prospect"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
